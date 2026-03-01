import Layout from "../components/Layout";
import SeoHead from "../components/SeoHead";
import DataTable from "../components/DataTable";
import { getLatestSnapshot } from "../lib/snapshotClient";

export default function IndexLive({ snapshot }) {
  return (
    <>
      <SeoHead
        title="Live Index - GTIXT"
        description="Real-time institutional benchmark rankings with live data integrity verification."
      />
      <Layout>
        <div className="page-header">
          <h1>Live Index</h1>
          <p>Real-time institutional benchmark rankings with live data integrity verification.</p>
        </div>

        <DataTable snapshot={snapshot} />
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  try {
    const snapshot = await getLatestSnapshot();
    return {
      props: { snapshot }
    };
  } catch (error) {
    console.error("Failed to fetch snapshot:", error);
    return {
      props: { snapshot: null }
    };
  }
}