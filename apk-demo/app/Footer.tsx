"use client";
// components/Footer.js
import Link from 'next/link';
import { useState, useEffect } from 'react';

const Footer = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkScreenSize();

        // Add event listener
        window.addEventListener('resize', checkScreenSize);

        // Clean up
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <>
            {/* Main Footer Content */}
            <footer className="bg-gray-100 border-t border-gray-300 hidden md:block">
                <div className="px-4 sm:px-6 lg:px-8 py-8">
                    {/* Top Section */}
                    <div className="hidden md:block">
                        <div className="flex justify-center">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mx-5 mb-8 text-center">
                                {/* Popular Categories */}
                                <div className="flex flex-col items-center">
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">Popular Categories</h3>
                                    <ul className="space-y-2">
                                        <li>
                                            <Link
                                                href="/search?category=Industrial+Machinery"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Industrial Machinery
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/search?category=Construction+Materials"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Construction Materials
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/search?category=Electronics+%26+Electricals"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Electronics & Electricals
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/search?category=Office+Supplies"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Office Supplies
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/search?category=Raw+Materials"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Raw Materials
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                {/* Popular Locations */}
                                <div className="flex flex-col items-center">
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">Popular Locations</h3>
                                    <ul className="space-y-2">
                                        <li>
                                            <Link
                                                href="/search?location=Mumbai"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Mumbai
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/search?location=Delhi"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Delhi
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/search?location=Bangalore"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Bangalore
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/search?location=Chennai"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Chennai
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/search?location=Hyderabad"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Hyderabad
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                {/* About Us */}
                                <div className="flex flex-col items-center">
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">About Us</h3>
                                    <ul className="space-y-2">
                                        <li>
                                            <Link
                                                href="/about"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                About BestBazaar
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/careers"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Careers
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/contact"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Contact Us
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/blog"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Business Blog
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/help"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Help & Support
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                {/* For Businesses */}
                                <div className="flex flex-col items-center">
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">
                                        For Businesses
                                    </h3>
                                    <ul className="space-y-2">
                                        <li>
                                            <Link
                                                href="/sell-online"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Sell on BestBazaar
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/business-solutions"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Business Solutions
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/supplier-registration"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Supplier Registration
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/buyer-registration"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Buyer Registration
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/advertise"
                                                className="text-gray-700 no-underline hover:no-underline hover:text-dynamic"
                                            >
                                                Advertise with Us
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                {/* Follow Us */}
                                <div className="flex flex-col items-center">
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">Follow Us</h3>
                                    <div className="flex space-x-4 justify-center">
                                        <a
                                            href="javascript:void(0)"
                                            className="text-dynamic hover:text-gray-300"
                                        >
                                            <span className="sr-only">Facebook</span>
                                            <svg
                                                className="h-8 w-8"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </a>
                                        <a
                                            href="javascript:void(0)"
                                            className="text-dynamic hover:text-gray-300"
                                        >
                                            <span className="sr-only">Twitter</span>
                                            <svg
                                                className="h-8 w-8"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                            </svg>
                                        </a>
                                        <Link
                                            href="https://www.instagram.com/bestb_azaar/"
                                            className="text-dynamic hover:text-gray-300"
                                        >
                                            <span className="sr-only">Instagram</span>
                                            <svg
                                                className="h-8 w-8"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </Link>
                                        <a
                                            href="javascript:void(0)"
                                            className="text-dynamic hover:text-gray-300"
                                        >
                                            <span className="sr-only">LinkedIn</span>
                                            <svg
                                                className="h-8 w-8"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                            </svg>
                                        </a>
                                    </div>

                                    {/* App Stores */}
                                    <div className="mt-6 flex flex-col items-center">
                                        <h3 className="text-md font-semibold text-gray-900 mb-4">Download App</h3>
                                        <div className="flex flex-col space-y-3 items-center">
                                            <a
                                                href="javascript:void(0)"
                                                className="no-underline hover:no-underline"
                                            >
                                                <img
                                                    src="/appstore.png"
                                                    alt="Download from App Store"
                                                    className="h-15 w-40"
                                                />
                                            </a>
                                            <a
                                                href="javascript:void(0)"
                                                className="no-underline hover:no-underline"
                                            >
                                                <img
                                                    src="/googleplay.png"
                                                    alt="Download from Google Play"
                                                    className="h-15 w-40"
                                                />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="border-t border-gray-300">
                        <div className="hidden md:block">
                            <div className="flex justify-center">
                                <div className="pt-8 flex flex-col md:flex-row justify-between items-center">
                                    {/* Logo and Copyright */}
                                    <div className="flex items-center mb-4 md:mb-0">
                                        <Link
                                            href="/"
                                            className="mx-2 mt-3 text-2xl no-underline hover:no-underline font-bold text-dynamic"
                                        >
                                            BestBazaar
                                        </Link>
                                        <span className="ml-4 text-gray-600 mx-10 mt-3">© 2025 BestBazaar.com. All rights reserved.</span>
                                    </div>
                                    {/* Legal Links */}
                                    <div className="flex flex-wrap justify-center">
                                        <Link
                                            href="/footer-content/terms"
                                            className="text-gray-600 hover:text-dynamic no-underline hover:no-underline mx-2 mb-2 md:mb-0"
                                        >
                                            Terms of Use
                                        </Link>
                                        <span className="text-gray-400 mx-1">•</span>
                                        <Link
                                            href="/footer-content/PrivacyPolicy"
                                            className="text-gray-600 hover:text-dynamic no-underline hover:no-underline mx-2 mb-2 md:mb-0"
                                        >
                                            Privacy Policy
                                        </Link>
                                        <span className="text-gray-400 mx-1">•</span>
                                        <Link
                                            href="/footer-content/CookiePolicy"
                                            className="text-gray-600 hover:text-dynamic no-underline hover:no-underline mx-2 mb-2 md:mb-0"
                                        >
                                            Cookie Policy
                                        </Link>
                                        <span className="text-gray-400 mx-1">•</span>
                                        <Link
                                            href="/footer-content/HelpCenter"
                                            className="text-gray-600 hover:text-dynamic no-underline hover:no-underline mx-2 mb-2 md:mb-0"
                                        >
                                            Help Center
                                        </Link>
                                        <span className="text-gray-400 mx-1">•</span>
                                        <Link
                                            href="/footer-content/FeedbackComponent"
                                            className="text-gray-600 hover:text-dynamic no-underline hover:no-underline mx-2 mb-2 md:mb-0"
                                        >
                                            Feedback
                                        </Link>
                                        <span className="text-gray-400 mx-1">•</span>
                                        <Link
                                            href="/sitemap"
                                            className="text-gray-600 hover:text-dynamic no-underline hover:no-underline mx-2 mb-2 md:mb-0"
                                        >
                                            Sitemap
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Mobile Footer */}
            {isMobile && (
                <>
                    {/* Spacer div to account for fixed mobile footer height */}
                    <div className="h-16 md:hidden"></div>

                    {/* Fixed mobile footer */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
                        <div className="flex justify-around items-center py-2">
                            <Link
                                href="/"
                                className="flex flex-col items-center text-gray-700 no-underline hover:no-underline"
                            >
                                <svg
                                    className="h-6 w-6 mb-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    />
                                </svg>
                                <span className="text-xs">Home</span>
                            </Link>

                            <Link
                                href="/search"
                                className="flex flex-col items-center text-gray-700 no-underline hover:no-underline"
                            >
                                <svg
                                    className="h-6 w-6 mb-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <span className="text-xs">Search</span>
                            </Link>

                            <Link
                                href="/ad/post"
                                className="flex flex-col items-center text-gray-700 no-underline hover:no-underline"
                            >
                                <div className="bg-gradient-to-r from-dynamic to-dynamic1 text-white rounded-full p-2 -mt-4 shadow-lg">
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                </div>
                                <span className="text-xs mt-1">Sell</span>
                            </Link>

                            <button
                                onClick={() => {
                                    // Force full page reload on mobile to ensure cookies are sent
                                    window.location.href = '/chat-v2';
                                }}
                                className="flex flex-col items-center text-gray-700 no-underline hover:no-underline"
                            >
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                                <span className="text-xs">Chat</span>
                            </button>

                            <button
                                onClick={() => {
                                    // Force full page reload on mobile to ensure cookies are sent
                                    window.location.href = '/profile';
                                }}
                                className="flex flex-col items-center text-gray-700 no-underline hover:no-underline"
                            >
                                <svg
                                    className="h-6 w-6 mb-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                <span className="text-xs">Account</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Footer;