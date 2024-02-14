import Image from 'next/image'

export default function Page() {
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col mb-6 overflow-hidden bg-white rounded-lg shadow-md md:flex-row">
        <div className="flex items-center justify-center p-4 bg-cover select-none md:w-1/5">
          <b className="text-xl">Discord.JS</b>
        </div>
        <div className="flex flex-col justify-between flex-grow p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Discord Bot: ElectricalWizard</h2>
            <p className="mt-2 text-gray-600">Discord bot for a server with friends.</p>
          </div>
          <div>
            <p className="mt-4 text-gray-500">Technologies: Discord.JS, JavaScript</p>
          </div>
        </div>
      </div>
      {/* < --- --- > */}
      <div className="flex flex-col mb-6 overflow-hidden bg-white rounded-lg shadow-md md:flex-row">
        <div className="flex items-center justify-center p-4 bg-cover select-none md:w-1/5">
          <b className="text-xl">Next.js</b>
        </div>
        <div className="flex flex-col justify-between flex-grow p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">A Personal Website: mystwiz.net</h2>
            <p className="mt-2 text-gray-600">A personal website with bio and project listing.</p>
          </div>
          <div>
            <p className="mt-4 text-gray-500">Technologies: Next.js, TailwindCSS</p>
          </div>
        </div>
      </div>
    </div>
  )
}