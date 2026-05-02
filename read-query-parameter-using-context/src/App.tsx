/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
} from "@fluentui/react-components";
import { EmployeeDatabaseService } from "./generated";
import { getContext } from "@microsoft/power-apps/app";

type DialogMode = "view" | "edit";

function App() {
  const [items, setItems] = React.useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<DialogMode>("view");
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);
  const [editForm, setEditForm] = React.useState({
    title: "",
    dob: "",
    email: "",
    jobTitle: "",
    department: "",
    totalExperience: "",
  });

  const getDepartmentValue = (item: any) => {
    return item?.Department?.Value ?? item?.Department ?? "-";
  };

  const openItemPopup = (item: any, mode: DialogMode) => {
    setSelectedItem(item);
    setDialogMode(mode);

    if (mode === "edit") {
      setEditForm({
        title: item?.Title ?? "",
        dob: item?.DOB ?? "",
        email: item?.Email ?? "",
        jobTitle: item?.JobTitle ?? "",
        department:
          getDepartmentValue(item) === "-" ? "" : getDepartmentValue(item),
        totalExperience:
          item?.TotalExperience === undefined || item?.TotalExperience === null
            ? ""
            : item.TotalExperience.toString(),
      });
    }

    setIsDialogOpen(true);
  };

  const onSaveEdit = () => {
    if (!selectedItem) {
      return;
    }

    const updatedItem = {
      ...selectedItem,
      Title: editForm.title,
      DOB: editForm.dob,
      Email: editForm.email,
      JobTitle: editForm.jobTitle,
      TotalExperience:
        editForm.totalExperience === ""
          ? null
          : Number(editForm.totalExperience),
      Department: {
        ...(selectedItem.Department || {}),
        Value: editForm.department,
      },
    };

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.ID === selectedItem.ID ? updatedItem : item,
      ),
    );
    setSelectedItem(updatedItem);
    setIsDialogOpen(false);
  };

  const getItems = async () => {
    let queryId: string | null = null;

    const context = await getContext();
    console.log("App context:", context);

    const params = context.app.queryParams;
    console.log("Query parameters:", params);
    queryId = params?.id ?? null;

    const res = await EmployeeDatabaseService.getAll();
    if (res.success) {
      const allItems = res.data || [];
      const filteredItems = queryId
        ? allItems.filter((item) => item.ID?.toString() === queryId)
        : allItems;

      setItems(filteredItems);

      if (queryId && filteredItems.length > 0) {
        openItemPopup(filteredItems[0], "view");
      }

      if (queryId && filteredItems.length === 0) {
        console.warn("No item found with ID from query:", queryId);
      }
    } else {
      console.error("Failed to fetch items:", res.error);
    }
  };

  React.useEffect(() => {
    console.log("App mounted");
    getItems();
  }, []);

  return (
    <div style={{ padding: "24px", fontFamily: "Segoe UI, sans-serif" }}>
      <h2>Employee Database 3</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {items.map((item: any) => (
          <div
            key={item.ID}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "16px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "18px" }}>{item.Title || "-"}</h3>
            <p style={{ margin: 0, color: "#666" }}>ID: {item.ID ?? "-"}</p>
            <p style={{ margin: 0, color: "#666" }}>
              Email: {item.Email || "-"}
            </p>
            <p style={{ margin: 0, color: "#666" }}>DOB: {item.DOB || "-"}</p>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <Button
                appearance="secondary"
                onClick={() => openItemPopup(item, "view")}
              >
                View
              </Button>
              <Button
                appearance="primary"
                onClick={() => openItemPopup(item, "edit")}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p style={{ marginTop: "16px", color: "#888" }}>No employees found.</p>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(_, data) => setIsDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {dialogMode === "view" ? "View Employee" : "Edit Employee"}
            </DialogTitle>
            <DialogContent>
              {selectedItem && dialogMode === "view" && (
                <div style={{ display: "grid", gap: "10px" }}>
                  <p style={{ margin: 0 }}>
                    <strong>Title:</strong> {selectedItem.Title || "-"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>DOB:</strong> {selectedItem.DOB || "-"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Email:</strong> {selectedItem.Email || "-"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Job Title:</strong> {selectedItem.JobTitle || "-"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Department:</strong>{" "}
                    {getDepartmentValue(selectedItem)}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Total Experience:</strong>{" "}
                    {selectedItem.TotalExperience ?? "-"}
                  </p>
                </div>
              )}

              {selectedItem && dialogMode === "edit" && (
                <div style={{ display: "grid", gap: "12px" }}>
                  <Field label="Title">
                    <Input
                      value={editForm.title}
                      onChange={(_, data) =>
                        setEditForm((current) => ({
                          ...current,
                          title: data.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="DOB">
                    <Input
                      value={editForm.dob}
                      onChange={(_, data) =>
                        setEditForm((current) => ({
                          ...current,
                          dob: data.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      value={editForm.email}
                      onChange={(_, data) =>
                        setEditForm((current) => ({
                          ...current,
                          email: data.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Job Title">
                    <Input
                      value={editForm.jobTitle}
                      onChange={(_, data) =>
                        setEditForm((current) => ({
                          ...current,
                          jobTitle: data.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Department">
                    <Input
                      value={editForm.department}
                      onChange={(_, data) =>
                        setEditForm((current) => ({
                          ...current,
                          department: data.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Total Experience">
                    <Input
                      value={editForm.totalExperience}
                      onChange={(_, data) =>
                        setEditForm((current) => ({
                          ...current,
                          totalExperience: data.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              {dialogMode === "edit" && (
                <Button appearance="primary" onClick={onSaveEdit}>
                  Save
                </Button>
              )}
              <Button
                appearance="secondary"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

export default App;
