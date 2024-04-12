import Link from 'next/link';
import { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: 'About | MysticalWizard',
};

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen mx-auto -mt-header pt-header max-w-7xl">
      <div className="max-w-md mx-auto overflow-hidden transition-shadow duration-300 ease-in-out bg-white rounded-lg shadow-lg hover:shadow-xl">
        <div className="px-6 py-4">
          <div className="mb-2 text-xl font-bold">About Me</div>
          <p className="text-base text-gray-700">
            Hey there! I&apos;m Wonsik Shin (aka MysticalWizard), a tech enthusiast with a passion for AI, machine learning, networking, and web development. Currently, I&apos;m diving deep into web development using NextJS. Check out the <Link href="/projects">projects</Link> page to see what I&apos;m working on!
          </p>
        </div>
      </div>
    </div>
  )
}
