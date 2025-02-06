
function App() {


  return (
    <div className="w-full flex h-screen justify-center items-center p-4">
      <div className="border-[1px] border-gray-700 max-w-6xl w-full min-h-[600px] rounded-lg">
        {/* Header */}
        <div className="flex justify-between h-20 border-b-[1px] border-gray-700">
          <div className="p-4">
            <p className="text-gray-300">signed in as name</p>
            <p className="text-gray-300 italic text-sm">3 user login</p>
          </div>
          <button className="m-2 sm:mr-4">Sign out</button>
        </div>
      </div>
    </div>
  )
}

export default App
