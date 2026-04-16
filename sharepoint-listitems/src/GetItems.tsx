import { useEffect, useState } from "react";
import { SharePointService } from "./generated";
import type { DataSet, Table } from "./generated/models/SharePointModel";

export type ItemRow = {
  id: string;
  title: string;
};

const useGetItemsLogic = () => {
  const [datasets, setDatasets] = useState<DataSet[]>([]);
  const [selectedDatasetName, setSelectedDatasetName] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableName, setSelectedTableName] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTable = tables.find(
    (table) => table.Name === selectedTableName,
  );

  useEffect(() => {
    void loadDatasets();
  }, []);

  useEffect(() => {
    if (!selectedDatasetName) {
      setTables([]);
      setSelectedTableName("");
      setItems([]);
      return;
    }

    void loadAllTables(selectedDatasetName);
  }, [selectedDatasetName]);

  useEffect(() => {
    if (!selectedDatasetName || !selectedTableName) {
      setItems([]);
      return;
    }
  }, [selectedDatasetName, selectedTableName]);

  const loadDatasets = async () => {
    setIsLoadingDatasets(true);
    setErrorMessage(null);

    try {
      const result = await SharePointService.GetDataSets();

      if (!result.success) {
        throw result.error ?? new Error("GetDataSets failed.");
      }

      const loadedDatasets = result.data?.value ?? [];
      setDatasets(loadedDatasets);
      setSelectedDatasetName(loadedDatasets[0]?.Name ?? "");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load datasets.",
      );
      setDatasets([]);
      setSelectedDatasetName("");
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const loadAllTables = async (datasetName: string) => {
    setIsLoadingTables(true);
    setErrorMessage(null);

    try {
      const result = await SharePointService.GetAllTables(datasetName);

      if (!result.success) {
        throw result.error ?? new Error("GetAllTables failed.");
      }

      const loadedTables = result.data?.value ?? [];
      setTables(loadedTables);
      setSelectedTableName(loadedTables[0]?.Name ?? "");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load tables.",
      );
      setTables([]);
      setSelectedTableName("");
      setItems([]);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const loadItemsHandler = async () => {
    setIsLoadingItems(true);
    setErrorMessage(null);

    try {
      const result = await SharePointService.GetItems(
        selectedDatasetName,
        selectedTableName,
      );

      if (!result.success) {
        throw result.error ?? new Error("GetItems failed.");
      }

      const rows = (result.data?.value ?? [])
        .map((item) => {
          const source = item as unknown as Record<string, unknown>;
          const properties = (source.dynamicProperties ?? {}) as Record<
            string,
            unknown
          >;

          const id =
            source.Id ??
            source.ID ??
            source.id ??
            properties.Id ??
            properties.ID ??
            properties.id;
          const title =
            source.Title ??
            source.title ??
            properties.Title ??
            properties.title;

          return {
            id: id == null ? "" : String(id),
            title: title == null ? "" : String(title),
          };
        })
        .filter((row) => row.id || row.title);

      setItems(rows);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load items.",
      );
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

  const getOpenTableUrl = (): string => {
    if (!selectedDatasetName || !selectedTable) {
      return "";
    }

    const source = selectedTable as unknown as Record<string, unknown>;
    const properties = (source.DynamicProperties ??
      source.dynamicProperties ??
      {}) as Record<string, unknown>;

    const candidates = [
      properties.webUrl,
      properties.WebUrl,
      properties.defaultViewUrl,
      properties.DefaultViewUrl,
      properties.listUrl,
      properties.ListUrl,
    ];

    const firstString = candidates.find(
      (value) => typeof value === "string" && value.length > 0,
    ) as string | undefined;

    if (firstString) {
      if (
        firstString.startsWith("http://") ||
        firstString.startsWith("https://")
      ) {
        return firstString;
      }

      if (firstString.startsWith("/")) {
        return `${trimTrailingSlash(selectedDatasetName)}${firstString}`;
      }
    }

    const listName = encodeURIComponent(
      selectedTable.DisplayName || selectedTableName,
    );
    return `${trimTrailingSlash(selectedDatasetName)}/Lists/${listName}/AllItems.aspx`;
  };

  const onLoadItems = async () => {
    await loadItemsHandler();
  };

  const onOpenTable = () => {
    const url = getOpenTableUrl();
    if (!url) {
      setErrorMessage("Cannot build a URL for the selected table.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return {
    datasets,
    selectedDatasetName,
    setSelectedDatasetName,
    tables,
    selectedTableName,
    setSelectedTableName,
    items,
    selectedTable,
    isLoadingDatasets,
    isLoadingTables,
    isLoadingItems,
    errorMessage,
    onLoadItems,
    onOpenTable,
  };
};

export function GetItems() {
  const {
    datasets,
    selectedDatasetName,
    setSelectedDatasetName,
    tables,
    selectedTableName,
    setSelectedTableName,
    items,
    isLoadingDatasets,
    isLoadingTables,
    isLoadingItems,
    errorMessage,
    onLoadItems,
    onOpenTable,
  } = useGetItemsLogic();

  return (
    <>
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <section className="controls">
        <label>
          Dataset
          <select
            value={selectedDatasetName}
            onChange={(event) => setSelectedDatasetName(event.target.value)}
            disabled={isLoadingDatasets || datasets.length === 0}
          >
            <option value="">Select dataset</option>
            {datasets.map((dataset) => (
              <option
                key={dataset.Name || dataset.DisplayName}
                value={dataset.Name ?? ""}
              >
                {dataset.DisplayName || dataset.Name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Table
          <select
            value={selectedTableName}
            onChange={(event) => setSelectedTableName(event.target.value)}
            disabled={
              !selectedDatasetName || isLoadingTables || tables.length === 0
            }
          >
            <option value="">Select table</option>
            {tables.map((table) => (
              <option
                key={table.Name || table.DisplayName}
                value={table.Name ?? ""}
              >
                {table.DisplayName || table.Name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void onLoadItems()}
          disabled={
            !selectedDatasetName || !selectedTableName || isLoadingItems
          }
        >
          Get list items
        </button>

        <button
          type="button"
          onClick={onOpenTable}
          disabled={!selectedDatasetName || !selectedTableName}
        >
          Open
        </button>
      </section>

      <section className="status">
        {isLoadingDatasets ? <p>Loading datasets...</p> : null}
        {isLoadingTables ? <p>Loading tables...</p> : null}
        {isLoadingItems ? <p>Loading items...</p> : null}
      </section>

      <section>
        <table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Title</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.id}-${index}`}>
                <td>{item.id}</td>
                <td>{item.title}</td>
              </tr>
            ))}
            {!isLoadingItems && items.length === 0 ? (
              <tr>
                <td colSpan={2}>No items.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
