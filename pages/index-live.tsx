import Layout from "../components/Layout";
import SeoHead from "../components/SeoHead";
import DataTable from "../components/DataTable";
import { getLatestSnapshot } from "../lib/snapshotClient";
import { useTranslation } from "../lib/useTranslationStub";

export default function IndexLive({ snapshot }: { snapshot: any }) {
  const { t } = useTranslation("common");
  return (
    <>
      <SeoHead
        title={t("indexLive.meta.title")}
        description={t("indexLive.meta.description")}
      />
      <Layout>
        <div className="page-header" suppressHydrationWarning>
          <h1>{t("indexLive.title")}</h1>
          <p>{t("indexLive.description")}</p>
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
