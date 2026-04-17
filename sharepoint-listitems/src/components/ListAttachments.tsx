import { useState } from "react";
import { SharePointService } from "../generated";
import { sharePointConfig } from "../sharePointConfig";

type AttachmentRow = {
  id: string;
  name: string;
  url: string;
};

type FileUploadStatus = "not-started" | "in-progress" | "done";

const maxFileSizeInBytes =
  sharePointConfig.attachments.maxFileSizeMb * 1024 * 1024;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result ?? "");
      const separatorIndex = result.indexOf(",");
      resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const getItemId = (value: Record<string, unknown> | undefined): number => {
  const rawId = value?.Id ?? value?.ID ?? value?.id;

  if (typeof rawId === "number") {
    return rawId;
  }

  if (typeof rawId === "string" && rawId.length > 0) {
    return Number(rawId);
  }

  throw new Error("The created SharePoint item did not return an item id.");
};

const getFileKey = (file: File): string =>
  `${file.name}-${file.lastModified}-${file.size}`;

export function ListAttachments() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<
    "idle" | "creating-item" | "uploading"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [fileStatuses, setFileStatuses] = useState<
    Record<string, FileUploadStatus>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    setSelectedFiles(nextFiles);
    setFileStatuses(
      nextFiles.reduce<Record<string, FileUploadStatus>>((statusMap, file) => {
        statusMap[getFileKey(file)] = "not-started";
        return statusMap;
      }, {}),
    );
    setMessage(null);
    setErrorMessage(null);
  };

  const validateFiles = (files: File[]) => {
    if (files.length === 0) {
      throw new Error("Select at least one file.");
    }

    const fileThatIsTooLarge = files.find(
      (file) => file.size > maxFileSizeInBytes,
    );

    if (fileThatIsTooLarge) {
      throw new Error(
        `${fileThatIsTooLarge.name} is larger than ${sharePointConfig.attachments.maxFileSizeMb} MB.`,
      );
    }
  };

  const ensureListItem = async (): Promise<number> => {
    if (currentItemId != null) {
      return currentItemId;
    }

    setCreateStep("creating-item");

    // Create the SharePoint list item first because attachments belong to an existing item.
    const result = await SharePointService.PostItem(
      sharePointConfig.dataset,
      sharePointConfig.table,
      { Title: sharePointConfig.newItemTitle },
    );

    if (!result.success) {
      throw result.error ?? new Error("PostItem failed.");
    }

    const itemId = getItemId(result.data);
    setCurrentItemId(itemId);
    return itemId;
  };

  const onCreateAttachments = async () => {
    setIsSubmitting(true);
    setCreateStep("idle");
    setUploadProgress({ done: 0, total: 0 });
    setMessage(null);
    setErrorMessage(null);

    try {
      validateFiles(selectedFiles);

      const itemId = await ensureListItem();
      setCreateStep("uploading");
      setUploadProgress({ done: 0, total: selectedFiles.length });

      const createdAttachments: AttachmentRow[] = [];

      for (const file of selectedFiles) {
        const fileKey = getFileKey(file);
        setFileStatuses((current) => ({
          ...current,
          [fileKey]: "in-progress",
        }));

        // CreateAttachment expects the raw base64 part, not the full data URL.
        const body = await toBase64(file);

        const result = await SharePointService.CreateAttachment(
          sharePointConfig.dataset,
          sharePointConfig.table,
          itemId,
          file.name,
          body,
        );

        if (!result.success) {
          throw (
            result.error ??
            new Error(`CreateAttachment failed for ${file.name}.`)
          );
        }

        const source = (result.data ?? {}) as Record<string, unknown>;
        const attachmentId = source.Id ?? source.ID ?? source.id ?? file.name;
        const attachmentName =
          source.DisplayName ?? source.Name ?? source.name ?? file.name;
        const attachmentUrl = source.AbsoluteUri ?? source.absoluteUri ?? "";

        createdAttachments.push({
          id: String(attachmentId),
          name: String(attachmentName),
          url: String(attachmentUrl),
        });

        setFileStatuses((current) => ({
          ...current,
          [fileKey]: "done",
        }));

        setUploadProgress((current) => ({
          ...current,
          done: current.done + 1,
        }));
      }

      setAttachments((currentAttachments) => [
        ...currentAttachments,
        ...createdAttachments,
      ]);
      setMessage(
        `Created ${createdAttachments.length} attachment${createdAttachments.length === 1 ? "" : "s"} for item ${itemId}.`,
      );
      setSelectedFiles([]);
      setUploadProgress({
        done: selectedFiles.length,
        total: selectedFiles.length,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not create the attachment.",
      );
    } finally {
      setCreateStep("idle");
      setIsSubmitting(false);
    }
  };

  const onDeleteAttachment = async (attachmentId: string) => {
    if (currentItemId == null) {
      return;
    }

    setIsDeletingId(attachmentId);
    setMessage(null);
    setErrorMessage(null);

    try {
      const result = await SharePointService.DeleteAttachment(
        sharePointConfig.dataset,
        sharePointConfig.table,
        currentItemId,
        attachmentId,
      );

      if (!result.success) {
        throw result.error ?? new Error("DeleteAttachment failed.");
      }

      setAttachments((currentAttachments) =>
        currentAttachments.filter(
          (attachment) => attachment.id !== attachmentId,
        ),
      );
      setMessage(`Deleted attachment ${attachmentId}.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not delete the attachment.",
      );
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <section className="attachment-card">
      <h2>List Attachments</h2>

      <p className="helper-text">
        This demo creates one SharePoint item with the Title value "
        {sharePointConfig.newItemTitle}" and then uploads the selected files as
        attachments.
      </p>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {message ? <div className="info-banner">{message}</div> : null}

      <section className="attachment-config">
        <p>
          Multiple files:{" "}
          {sharePointConfig.attachments.allowMultiple ? "Yes" : "No"}
        </p>
        <p>
          Allowed file types: {sharePointConfig.attachments.acceptedFileTypes}
        </p>
        <p>Max file size: {sharePointConfig.attachments.maxFileSizeMb} MB</p>
      </section>

      <label>
        Attachments
        <input
          type="file"
          multiple={sharePointConfig.attachments.allowMultiple}
          accept={sharePointConfig.attachments.acceptedFileTypes}
          onChange={onFileChange}
        />
      </label>

      <p className="helper-text">
        Note: Parallel upload will not work here because it can cause a "Save
        conflict" issue.
      </p>

      <button
        type="button"
        onClick={() => void onCreateAttachments()}
        disabled={selectedFiles.length === 0 || isSubmitting}
      >
        {isSubmitting ? "Creating..." : "Create attachment"}
      </button>

      {createStep === "creating-item" ? (
        <p className="progress-text loading-pulse">
          Progress: creating SharePoint item...
        </p>
      ) : null}
      {createStep === "uploading" ? (
        <p className="progress-text loading-pulse">
          Progress: uploading attachments {uploadProgress.done}/
          {uploadProgress.total}
        </p>
      ) : null}

      <section className="selected-files">
        <h3>Selected files</h3>
        <ul>
          {selectedFiles.map((file) => (
            <li key={getFileKey(file)} className="file-progress-row">
              <span
                className={`progress-dot status-${fileStatuses[getFileKey(file)] ?? "not-started"}`}
                aria-hidden="true"
              />
              <span>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </li>
          ))}
          {selectedFiles.length === 0 ? <li>No files selected.</li> : null}
        </ul>
      </section>

      <section className="selected-files">
        <h3>Created attachments</h3>
        <p>Item id: {currentItemId ?? "Not created yet"}</p>
        <ul>
          {attachments.map((attachment) => (
            <li key={attachment.id} className="attachment-row">
              {attachment.url ? (
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  {attachment.name}
                </a>
              ) : (
                <span>{attachment.name}</span>
              )}
              <button
                type="button"
                onClick={() => void onDeleteAttachment(attachment.id)}
                disabled={isDeletingId === attachment.id}
              >
                {isDeletingId === attachment.id ? "Deleting..." : "Delete"}
              </button>
              {isDeletingId === attachment.id ? (
                <span className="progress-text loading-pulse">
                  {" "}
                  Deleting...
                </span>
              ) : null}
            </li>
          ))}
          {attachments.length === 0 ? (
            <li>No attachments created yet.</li>
          ) : null}
        </ul>
      </section>
    </section>
  );
}
