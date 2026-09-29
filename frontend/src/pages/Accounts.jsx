import { SimpleListPage } from "../components/SimpleListPage";

export function Accounts() {
  return (
    <SimpleListPage
      title="Cash & Bank Accounts"
      apiPath="/accounts"
      hideDelete
      columns={[
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "opening_balance", label: "Opening balance", render: (r) => `₦${Number(r.opening_balance).toLocaleString()}` },
      ]}
      formFields={[
        { key: "name", label: "Name", required: true },
        { key: "type", label: "Type (cash/bank)", required: true },
        { key: "openingBalance", label: "Opening balance", type: "number" },
      ]}
    />
  );
}
