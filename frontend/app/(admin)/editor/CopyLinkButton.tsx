import { LinkToolbarProps, useComponentsContext } from "@blocknote/react";

export function CopyLinkButton(props: LinkToolbarProps) {
  const Components = useComponentsContext()!;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(props.url);
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <Components.LinkToolbar.Button
      mainTooltip="Copy Link"
      onClick={handleCopyLink}
    >
      📋
    </Components.LinkToolbar.Button>
  );
}