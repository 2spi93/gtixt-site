import Layout from "../components/Layout";
import SeoHead from "../components/SeoHead";
import DataTable from "../components/DataTable";
import { getLatestSnapshot } from "../lib/snapshotClient";
import { useTranslation } from "../lib/useTranslationStub";

export default function Firms({ snapshot }: { snapshot: any }) {
  const { t } = useTranslation("common");
  return (
    <>
      <SeoHead
        title={t("firms.meta.title")}
        description={t("firms.meta.description")}
      />
      <Layout>
        <div className="page-header">
          <h1>{t("firms.title")}</h1>
          <p>{t("firms.description")}</p>
        </div>

        <DataTable records={snapshot?.records || []} />
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  try {
    const snapshot = await getLatestSnapshot();
    return {
      props: { snapshot },
    };
  } catch (error) {
    console.error("Failed to fetch snapshot:", error);
    return {
      props: { snapshot: null },
    };
  }
}
