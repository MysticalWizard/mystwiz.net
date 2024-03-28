import { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: 'Specs | MysticalWizard',
};

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-4 space-y-8">
      <div className="mx-auto overflow-hidden transition-shadow duration-300 ease-in-out bg-white rounded-lg shadow-lg w-max hover:shadow-xl">
        <div className="px-6 py-4 space-y-4">
          <div id="PC">
            <div className="mb-2 text-xl font-bold">PC</div>
            <div className="text-base text-gray-700">
              <p>CPU: Intel Core i5-9600K OC@4.80GHz</p>
              <p>Cᴏᴏʟᴇʀ: Cooler Master MasterLiquid ML240L RGB</p>
              <p>Mᴏʙᴏ: MSI MPG Z390 GAMING EDGE AC</p>
              <p>RAM: Corsair VENGEANCE RGB PRO 32GB (2 x 16GB) DDR4 3000MHz CL16</p>
              <p>GPU: MSI GeForce GTX 1060 GAMING X 6G</p>
              <p>Sᴛᴏʀᴀɢᴇ1: Samsung 990 PRO 1TB</p>
              <p>Sᴛᴏʀᴀɢᴇ2: Samsung 970 EVO Plus 500GB</p>
              <p>Sᴛᴏʀᴀɢᴇ3: Kingston A400 240GB</p>
              <p>Cᴀsᴇ: Corsair 4000D Airflow Black</p>
              <p>PSU: Cooler Master V550</p>
            </div>
          </div>
          <div id="Peripherals">
            <div className="mb-2 text-xl font-bold">Peripherals</div>
            <div className="text-base text-gray-700">
              <p>Kᴇʏʙᴏᴀʀᴅ1: HyperX Alloy Origins Core</p>
              <p>Kᴇʏʙᴏᴀʀᴅ2: Ducky One2 TKL (Cherry MX Red)</p>
              <p>Mᴏᴜsᴇ1: Logitech G Pro X Superlight</p>
              <p>Mᴏᴜsᴇ2: Logitech G502 Hero</p>
              <p>Mᴏᴜsᴇᴘᴀᴅ: Cherry G80 Desk Soft (900x350mm)</p>
              <p>Hᴇᴀᴅsᴇᴛ: HyperX Cloud II</p>
              <p>Mɪᴄʀᴏᴘʜᴏɴᴇ: HyperX Quadcast S</p>
              <p>Mɪᴄ Sᴛᴀɴᴅ: InnoGear Boom Arm</p>
              <p>Hᴀɴᴅᴄᴀᴍ: Logitech StreamCam</p>
              <p>Kᴇʏᴘᴀᴅ: Wooting UwU RGB</p>
              <p>Tᴀʙʟᴇᴛ: Wacom CTL4100 Intuos S</p>
              <p>Sᴛʀᴇᴀᴍᴅᴇᴄᴋ: Elgato Stream Deck +</p>
              <p>Mᴏɴɪᴛᴏʀ1: ASUS VG259QR 24.5&quot; 1080p IPS 165Hz</p>
              <p>Mᴏɴɪᴛᴏʀ2: Pixio PX248 PRO 24&quot; 1080p IPS 165Hz</p>
            </div>
          </div>
          <div className="text-sm text-neutral-500">
            <span>Last updated: 2024.02.13</span>
          </div>
        </div>
      </div>
    </div>
  )
}
