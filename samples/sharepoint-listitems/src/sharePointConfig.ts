export const sharePointConfig = {
  dataset: "https://swami01.sharepoint.com/sites/playground",
  table: "f1c71037-52c4-435b-afdb-f3e4fd3a2a72",
  newItemTitle: "Hello there",
  attachments: {
    allowMultiple: true,
    acceptedFileTypes: ".png,.jpg,.jpeg,.pdf,.txt",
    maxFileSizeMb: 5,
  },
} as const;

export type SharePointAttachmentConfig = typeof sharePointConfig.attachments;
