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
      // Fetch the file list from public/prefab-file-list.json
      const response = await fetch("prefab-file-list.json");
      console.log("Response:", response);

      if (!response.ok) throw new Error("File list not found at prefab-file-list.json");

      const filePaths: string[] = await response.json(); // List of file names (e.g., ["file1.zip", "file2.zip"])
      console.log("File paths:", filePaths);

      // Fetch and add each .zip file to the prefab folder in the zip
      for (const filePath of filePaths) {
        const fileResponse = await fetch(`prefab/${filePath}`);
        if (fileResponse.ok) {
          const blob = await fileResponse.blob();
          prefabFolder?.file(filePath, blob); // Add the file to the zip
        } else {
          console.error(`Failed to fetch file: ${filePath}`);
        }
      }

      // Generate the ZIP file as a Blob
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content); // Create a URL for the generated zip file
      link.download = "prefab.zip"; // Set the download name
      link.click(); // Trigger the download

      console.log("Download started for prefab.zip");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to create ZIP:", errorMessage);
      alert("An error occurred while creating the ZIP file.");
    }
  }, []); // Only recreate the function if dependencies change

  useEffect(() => {
    api.setAddonShortcut("addon/my-addon", {
      label: "Download prefab.zip [O]",
      defaultShortcut: ["O"], // Default keyboard shortcut
      actionName: "download_prefab", // Action name for the shortcut
      showInMenu: false, // Do not show in menu, but allow keyboard shortcut
      action: afterClick, // Associate the action with the click handler
    });
  }, [afterClick, api]);

  return (
    <IconButton
      key="addon/my-addon/tool"
      title="Download prefab.zip"
      onClick={afterClick} // Trigger ZIP download when clicked
    >
      <DownloadIcon />
    </IconButton>
  );
});
