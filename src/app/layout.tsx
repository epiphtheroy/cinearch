import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { AuthWrapper } from '@/components/AuthWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'CineArch',
    description: 'Automated movie archive platform',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthWrapper>
                    <Navbar />
                    {children}
                </AuthWrapper>
            </body>
        </html>
    )
}
