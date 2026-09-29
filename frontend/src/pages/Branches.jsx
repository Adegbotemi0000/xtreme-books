import { SimpleListPage } from "../components/SimpleListPage";

export function Branches() {
  return (
    <SimpleListPage
      title="Branches"
      apiPath="/branches"
      importable
      hideDelete
      columns={[
        { key: "name", label: "Name" },
        { key: "address", label: "Address" },
      ]}
      formFields={[
        { key: "name", label: "Name", required: true },
        { key: "address", label: "Address" },
      ]}
    />
  );
}
