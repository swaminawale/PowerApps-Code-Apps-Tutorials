// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useState } from "react";
// import "./App.css";
// import InvoicesListService from "./generated/services/InvoicesListService";
// import { DatePicker, TextField } from "@fluentui/react";

// interface Invoice {
//   ID?: number;
//   Title: string;
//   InvoiceID: string;
//   TotalCost: number;
//   DueDate?: string;
//   BilledToName: string;
//   Status?: {
//     Value: string;
//   };
// }

// function App() {
//   const [records, setRecords] = useState<Invoice[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedId, setSelectedId] = useState<number | null>(null);

//   // ==============================
//   // LOAD DATA
//   // ==============================
//   useEffect(() => {
//     loadRecords();
//   }, []);
//   const loadRecords = async () => {
//     try {
//       const result: any = await InvoicesListService.getAll();
//       setRecords(result.data ?? []);
//     } catch (err) {
//       console.error("Error loading invoices:", err);
//     } finally {
//       setLoading(false);
//     }
//   };
//   // ==============================
//   // CRUD FUNCTION PLACEHOLDERS
//   // ==============================

//   const handleCreate = async () => {
//     console.log("Create clicked");
//     // TODO: implement create logic
//     // const contentTypeId = "0x0100...";

//     const payload: any = {
//       Title: "Sample entry",
//       InvoiceID: "INV-001",
//       WorkDetails: "Details about the work done",
//       TotalCost: 1500,
//       InvoiceDate: new Date().toISOString(),
//       DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//       BilledToName: "Contoso Ltd.",
//       BilledToAddress: "123 Contoso Street, City, Country",
//       Status: {
//         Id: 0,
//         Value: "Under Review",
//       },

//       AssignedTo: {
//         "@odata.type":
//           "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
//         Claims: "i:0#.f|membership|admin@swami01.onmicrosoft.com",
//         DisplayName: "Swami",
//         Email: "admin@swami01.onmicrosoft.com",
//         Picture:
//           "https://swami01.sharepoint.com/sites/PowerAppsEducation/_layouts/15/UserPhoto.aspx?Size=L&AccountName=admin@swami01.onmicrosoft.com",
//         Department: null,
//         JobTitle: "Digital Marketing Specialist",
//       },
//       MultipleUsers: [
//         {
//           "@odata.type":
//             "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
//           Claims: "i:0#.f|membership|admin@swami01.onmicrosoft.com",
//           DisplayName: "Swami",
//           Email: "admin@swami01.onmicrosoft.com",

//           Department: null,
//           JobTitle: "Digital Marketing Specialist",
//         },
//         {
//           "@odata.type":
//             "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
//           Claims: "i:0#.f|membership|sunil@swami01.onmicrosoft.com",
//           DisplayName: "Sunil Gangisetty",
//           Email: "sunil@swami01.onmicrosoft.com",

//           Department: null,
//           JobTitle: null,
//         },
//         {
//           "@odata.type":
//             "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
//           Claims: "i:0#.f|membership|service@swami01.onmicrosoft.com",
//           DisplayName: "Service",
//           Email: "service@swami01.onmicrosoft.com",

//           Department: null,
//           JobTitle: null,
//         },
//       ],
//     };

//     // create
//     const created = await InvoicesListService.create(payload);
//     if (created.data) {
//       alert("Record created with ID: " + created.data.ID);
//       loadRecords();
//     }
//   };

//   const handleUpdate = () => {
//     console.log("Update clicked");
//     const payload: any = {
//       Title: "Updates - Sample entry",
//       InvoiceID: "Updates - INV-001",
//       WorkDetails: "Updates - Details about the work done",
//       TotalCost: 1500,
//       InvoiceDate: new Date().toISOString(),
//       DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//       BilledToName: "Updates - Contoso Ltd.",
//       BilledToAddress: "Updates - 123 Contoso Street, City, Country",
//       Status: {
//         Id: 0,
//         Value: "Under Review",
//       },

//       AssignedTo: {
//         "@odata.type":
//           "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
//         Claims: "i:0#.f|membership|admin@swami01.onmicrosoft.com",
//         DisplayName: "Swami",
//         Email: "admin@swami01.onmicrosoft.com",

//         Department: null,
//         JobTitle: "Digital Marketing Specialist",
//       },
//       MultipleUsers: [
//         {
//           "@odata.type":
//             "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
//           Claims: "i:0#.f|membership|admin@swami01.onmicrosoft.com",
//           DisplayName: "Swami",
//           Email: "admin@swami01.onmicrosoft.com",

//           Department: null,
//           JobTitle: "Digital Marketing Specialist",
//         },
//         {
//           "@odata.type":
//             "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
//           Claims: "i:0#.f|membership|sunil@swami01.onmicrosoft.com",
//           DisplayName: "Sunil Gangisetty",
//           Email: "sunil@swami01.onmicrosoft.com",

//           Department: null,
//           JobTitle: null,
//         },
//         {
//           "@odata.type":
//             "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
//           Claims: "i:0#.f|membership|service@swami01.onmicrosoft.com",
//           DisplayName: "Service",
//           Email: "service@swami01.onmicrosoft.com",

//           Department: null,
//           JobTitle: null,
//         },
//       ],
//     };
//     const idToUpdate = selectedId ?? 0; // Replace with actual ID to update
//     InvoicesListService.update(idToUpdate.toString(), payload).then(
//       (result) => {
//         if (result.data) {
//           alert("Record updated with ID: " + result.data.ID);
//           loadRecords();
//         }
//       },
//     );
//   };

//   const handleDelete = (id: number) => {
//     console.log("Delete clicked", id);

//     InvoicesListService.delete(id.toString()).then(() => {
//       alert("Record deleted with ID: " + id);
//       loadRecords();
//     });
//   };

//   const handleEdit = (item: Invoice) => {
//     setSelectedId(item.ID ?? null);
//   };

//   // ==============================
//   // UI
//   // ==============================

//   return (
//     <div className="container">
//       <div className="button-group">
//         {selectedId ? (
//           <>
//             <p>Selected item id to update: {selectedId}</p>
//             <button className="btn update" onClick={handleUpdate}>
//               Update
//             </button>
//           </>
//         ) : (
//           <button className="btn create" onClick={handleCreate}>
//             Create
//           </button>
//         )}
//       </div>

//       <div className="formSection">
//         <div className="grid3">
//           <TextField label="Invoice Id" />
//           <DatePicker label="Invoice date" />
//           <TextField label="Title" />
//         </div>
//         <div className="grid3">
//           <TextField label="Total cost" />
//           <TextField label="Billed to name" />
//           <TextField label="Billed to address" />
//         </div>

//         <div className="grid2">
//           <DatePicker label="Due date" />
//           <TextField label="Work details" multiline />
//         </div>
//       </div>

//       {/* ================== TABLE ================== */}
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <div className="table-wrapper">
//           <table className="invoice-table">
//             <thead>
//               <tr>
//                 <th>ID</th>
//                 <th>Invoice</th>
//                 <th>Title</th>
//                 <th>Client</th>
//                 <th>Due</th>
//                 <th>Total</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {records.map((item) => (
//                 <tr key={item.ID}>
//                   <td>{item.ID}</td>
//                   <td>{item.InvoiceID}</td>
//                   <td>{item.Title}</td>
//                   <td>{item.BilledToName}</td>
//                   <td>
//                     {item.DueDate
//                       ? new Date(item.DueDate).toLocaleDateString()
//                       : "-"}
//                   </td>
//                   <td>${item.TotalCost?.toLocaleString()}</td>
//                   <td>
//                     <span className="status-badge">
//                       {item.Status?.Value ?? "N/A"}
//                     </span>
//                   </td>
//                   <td>
//                     <button
//                       className="action edit"
//                       onClick={() => handleEdit(item)}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       className="action delete"
//                       onClick={() => item.ID && handleDelete(item.ID)}
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
