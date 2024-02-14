'use client'

import React from "react";
import Image from "next/image";
import Typewriter from 'typewriter-effect';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-8 overflow-hidden text-center -mt-header">
      <Image
        src="/profile.png"
        alt="Profile"
        width={200}
        height={200}
        className="rounded-full select-none"
      />
      <div>
        <h1 className="text-4xl font-medium dark:text-white">MysticalWizard</h1>
        <div className="dark:text-white">
          <Typewriter 
            options={{
              strings: [
                'print("Hello World!")',
                'console.log("Hello World");',
                'Console.WriteLine("Hello World!");',
                'System.out.println("Hello World!");',
                'cout << "Hello World!";',
                'echo "Hello World!";'
              ],
              autoStart: true,
              loop: true
            }}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 dark:text-white">
        <a href="https://osu.ppy.sh/users/19430051/osu/" target="_blank" rel="noopener noreferrer">osu!</a>
        <a href="https://steamcommunity.com/id/mysticalwiz/" target="_blank" rel="noopener noreferrer">Steam</a>
        <a href="https://www.youtube.com/channel/UCGeXuxX5zk3T9KAhdpqRUfA/" target="_blank" rel="noopener noreferrer">YouTube</a>
        <a href="https://www.instagram.com/maring_shin/" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="https://github.com/mysticalwizard/" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  )
}
