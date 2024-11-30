import React, { memo, useCallback, useEffect } from "react";
import { API } from "storybook/internal/manager-api"; // Type for Storybook API
import { IconButton } from "storybook/internal/components";
import { DownloadIcon } from "@storybook/icons";
import JSZip from "jszip"; // Ensure JSZip is installed: `npm install jszip`

// Define props type for the Tool component
interface ToolProps {
  api: API; // Explicitly type the Storybook API
}

export const Tool = memo(function MyAddonSelector({ api }: ToolProps) {
  const afterClick = useCallback(async () => {
    console.log("Creating prefab.zip...");

    const zip = new JSZip();
    const prefabFolder = zip.folder("prefab");

    try {
      // Fetch the file list JSON
      const response = await fetch("/storybook-static/prefab-file-list.json");
      if (!response.ok) throw new Error("File list not found");
      const filePaths: string[] = await response.json();

      // Fetch and add each file to the ZIP
      for (const path of filePaths) {
        const fileResponse = await fetch(`/storybook-static/prefab/${path}`);
        if (fileResponse.ok) {
          const blob = await fileResponse.blob();
          prefabFolder?.file(path, blob); // Optional chaining in case folder creation fails
        } else {
          console.error(`Failed to fetch file: ${path}`);
        }
      }

      // Generate the ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "prefab.zip";
      link.click();

      console.log("Download started for prefab.zip");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to create ZIP:", errorMessage);
      alert("An error occurred while creating the ZIP file.");
    }
  }, []);

  useEffect(() => {
    api.setAddonShortcut("addon/my-addon", {
      label: "Download prefab.zip [O]",
      defaultShortcut: ["O"],
      actionName: "download_prefab",
      showInMenu: false,
      action: afterClick,
    });
  }, [afterClick, api]);

  return (
    <IconButton
      key="addon/my-addon/tool"
      title="Download prefab.zip"
      onClick={afterClick}
    >
      <DownloadIcon />
    </IconButton>
  );
});
