import { SimpleListPage } from "../components/SimpleListPage";

export function Suppliers() {
  return (
    <SimpleListPage
      title="Suppliers"
      apiPath="/suppliers"
      importable
      columns={[
        { key: "name", label: "Name" },
        { key: "tin", label: "TIN" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
      ]}
      formFields={[
        { key: "name", label: "Name", required: true },
        { key: "tin", label: "TIN" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address" },
      ]}
    />
  );
}
