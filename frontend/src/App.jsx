import React from "react";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Results from "./pages/Results";

const App = () => {
  const [page, setPage] = React.useState("dashboard");
  const [globalScore, setGlobalScore] = React.useState(null);

  const renderPage = () => {
    switch (page) {
      case "upload":
        return <Upload setGlobalScore={setGlobalScore} setPage={setPage} />;
      case "results":
        return <Results globalScore={globalScore} setGlobalScore={setGlobalScore} />;
      default:
        return <Dashboard globalScore={globalScore} />;
    }
  };

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <span className="brand">AI ATS</span>
        <div className="nav-links">
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
          <button onClick={() => setPage("upload")}>Upload</button>
          <button onClick={() => setPage("results")}>Results</button>
        </div>
      </nav>
      <div className="app-content">{renderPage()}</div>
    </div>
  );
};

export default App;

