/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Button } from "@fluentui/react-components";
import { SharePointService } from "./generated";
import "./App.css";

const SITE_URL = "https://swami01.sharepoint.com/sites/playground";
const LIST_ID = "f1c71037-52c4-435b-afdb-f3e4fd3a2a72";

type IApiCallDebug = {
  callNo: number;
  itemsLoaded: number;
  totalLoaded: number;
};

const App = () => {
  const [items, setItems] = React.useState<any>([]);
  const [loading, setLoading] = React.useState(false);
  const [apiCallCount, setApiCallCount] = React.useState(0);
  const [totalLoaded, setTotalLoaded] = React.useState(0);
  const [callDebug, setCallDebug] = React.useState<IApiCallDebug[]>([]);

  const getItemsUsingHTTPRequest = async () => {
    setLoading(true);
    setItems([]);
    setApiCallCount(0);
    setTotalLoaded(0);
    setCallDebug([]);

    try {
      // SharePoint returns max items per page.
      // We start with page 1 URL, then keep following odata.nextLink.
      const PAGE_SIZE = 5000;
      let allItems: any[] = [];
      let callNo = 0;
      let uri: string | null =
        `_api/web/lists/getbyid('${LIST_ID}')/items?$top=${PAGE_SIZE}&$orderby=ID desc`;

      while (uri) {
        callNo += 1;
        setApiCallCount(callNo);

        const response = await SharePointService.HttpRequest(SITE_URL, {
          method: "GET",
          uri,
          headers: { accept: "application/json;odata=nometadata" },
        });

        const body = response.data as unknown as {
          value?: any[];
          "odata.nextLink"?: string;
        };

        // Add current page items to one big array.
        const pageItems = body.value ?? [];
        allItems = allItems.concat(pageItems);
        setTotalLoaded(allItems.length);

        // Simple debug log for UI (how many items each API call returned).
        setCallDebug((prev) => [
          ...prev,
          {
            callNo,
            itemsLoaded: pageItems.length,
            totalLoaded: allItems.length,
          },
        ]);

        // If SharePoint gives next link, fetch next page.
        // nextLink is full URL, but HttpRequest needs relative _api path.
        const nextLink = body["odata.nextLink"];
        if (nextLink) {
          const relMatch = nextLink.match(/(_api\/.+)$/);
          uri = relMatch ? relMatch[1] : null;
          console.log(
            "Fetching next page with URI:",
            decodeURIComponent(uri ?? ""),
          );
        } else {
          uri = null;
        }
      }

      setItems(allItems);
    } catch (error) {
      console.error("Error loading list items:", error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsUsingService = async () => {
    setLoading(true);
    setItems([]);
    setApiCallCount(0);
    setTotalLoaded(0);
    setCallDebug([]);

    try {
      const response = await SharePointService.GetItems(
        SITE_URL,
        LIST_ID,
        "",
        "",
        5000,
      );
      setItems(response.data.value);
      setTotalLoaded(response.data?.value?.length || 0);
    } catch (error) {
      console.error("Error loading list items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={getItemsUsingHTTPRequest} disabled={loading}>
        {loading ? "Loading..." : "Get Items"}
      </Button>

      <Button
        onClick={getItemsUsingService}
        disabled={loading}
        style={{ marginLeft: "8px" }}
      >
        {loading ? "Loading..." : "Get Items (Service)"}
      </Button>

      <div
        style={{ marginTop: "12px", padding: "10px", border: "1px solid #ddd" }}
      >
        <h4 style={{ margin: "0 0 8px" }}>Debug Info</h4>
        <div>Status: {loading ? "Loading pages..." : "Completed"}</div>
        <div>API calls made: {apiCallCount}</div>
        <div>Items loaded so far: {totalLoaded}</div>
        <div style={{ marginTop: "8px" }}>
          {callDebug.length === 0 ? (
            <span>No calls yet</span>
          ) : (
            <ul style={{ margin: 0 }}>
              {callDebug.map((log) => (
                <li key={log.callNo}>
                  Call {log.callNo}: {log.itemsLoaded} items (total:{" "}
                  {log.totalLoaded})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h3>Total records: {items.length}</h3>
      <table>
        <thead>
          <tr>
            <th>Row #</th>
            <th>Id</th>
            <th>Title</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, index: number) => (
            <tr key={item.ID}>
              <td>{index + 1}</td>
              <td>{item.ID}</td>
              <td>{item.Title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
