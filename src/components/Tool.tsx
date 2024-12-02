import React, { memo, useCallback, useEffect } from "react";
import { API } from "storybook/internal/manager-api"; // Type for Storybook API
import { IconButton } from "storybook/internal/components";
import { DownloadIcon } from "@storybook/icons";

interface ToolProps {
  api: API;
}

export const Tool = memo(function MyAddonSelector({ api }: ToolProps) {
  const afterClick = useCallback(async () => {
    try {
      // Get the currently rendered story data
      const storyData = api.getCurrentStoryData();

     console.log("Current Story Data:", storyData);
      if (!storyData) {
        throw new Error("No active story found.");
      }

      const { name } = storyData; // Assuming 'name' uniquely identifies the story component
      console.log("Current Story Name:", name);

      // Map story name to prefab zip filename
      const zipFilename = `${name}.zip`;
      const zipFilePath = `/prefabs/${zipFilename}`;
      console.log("Attempting to fetch:", zipFilePath);

      // Fetch the specific prefab zip file
      const response = await fetch(zipFilePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch prefab zip: ${zipFilename}`);
      }

      const blob = await response.blob();

      // Trigger download of the prefab zip file
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = zipFilename;
      link.click();

      console.log(`Download started for: ${zipFilename}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to download prefab zip:", errorMessage);
      alert("An error occurred while downloading the prefab zip.");
    }
  }, [api]);

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
