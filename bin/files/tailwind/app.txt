const App = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-[#1a1a1a] text-[#f2f2f2]">
      <div className="w-[90%] max-w-[400px] rounded-xl bg-[#2a2a2a] p-10 text-center shadow-xl">
        <h1 className="mb-3 text-4xl font-bold text-[#f8c04e]">Hello!</h1>
        <p className="mb-5 text-lg text-[#a3b8c5]">Welcome to my custom app</p>
        <button
          className="mt-4 rounded-full bg-[#e0aa3f] px-6 py-3 text-lg font-semibold text-black transition-all duration-300 hover:bg-[#f3be54] hover:-translate-y-1 focus:outline-none cursor-pointer"
          onClick={() => window.open("https://zeropse.xyz", "_blank")}
        >
          Visit my site
        </button>
      </div>
    </div>
  );
};

export default App;
