const App = () => {
  return (
    <div className="container">
      <h1 className="title">Hello!</h1>
      <p className="subtitle">Welcome to my custom app</p>
      <button
        className="button"
        onClick={() => window.open("https://zeropse.xyz", "_blank")}
      >
        Visit my site
      </button>
    </div>
  );
};

export default App;
