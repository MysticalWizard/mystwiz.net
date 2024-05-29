import React from 'react'
import Link from 'next/link'
import { SocialIcon } from 'react-social-icons'

export default function Header() {
  return (
    <header className={`sticky top-0 z-20 p-4 bg-white dark:bg-[#1a1a1a]`}>
      <div className="flex items-start justify-between mx-auto select-none max-w-7xl xl:items-center dark:text-white">
        <div className="flex flex-row items-center gap-4 my-auto">
          <Link href="/">mystwiz.net</Link>
          <span>{"/"}</span>
          <Link href="/about" className="dark:text-neutral-300 dark:hover:text-white">about</Link>
          <Link href="/projects" className="dark:text-neutral-300 dark:hover:text-white">projects</Link>
        </div>
        <div className="flex flex-row items-center">
          <SocialIcon
            url="https://github.com/MysticalWizard/mystwiz.net"
            fgColor="gray"
            bgColor="transparent"
            label="GitHub Repository"
          />
        </div>
      </div>
    </header>
  )
} 
