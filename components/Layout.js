import Header from "./Header";
import Footer from "./Footer";
import SeoHead from "./SeoHead";

export default function Layout({ title, children }) {
  return (
    <div className="app">
      <SeoHead title={title} />
      <Header />
      <main className="container">{children}</main>
      <Footer />
    </div>
  );
}