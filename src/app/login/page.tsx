import { login, signup } from './actions'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-sm space-y-8 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to your account to continue
                    </p>
                </div>

                <form className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            formAction={login}
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                        >
                            Sign in
                        </button>
                        <button
                            formAction={signup}
                            className="flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Create account
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                            Or continue with
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-3 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 opacity-60 cursor-not-allowed"
                >
                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                        <path
                            d="M12.0003 20.45c4.6667 0 7.3334-3.3333 7.3334-8.1833 0-.7667-.0667-1.4-.2-1.95h-7.1334v3.6833h4.1c-.1833 1.05-.7333 2.1333-1.6333 2.85v2.25h2.5166c1.55-1.4 2.5167-3.6 2.5167-6.9 0-.55-.05-1.0833-.1333-1.6h-4.8834v-3.6h8.8c.1167.6333.1834 1.3.1834 2 0 4.6333-3.0834 8.7167-7.9667 8.7167-4.6333 0-8.5833-3.2333-9.9333-7.5833l-2.6167 2.0166c1.45 4.15 5.35 6.9667 9.8 6.9667z"
                            fill="#4285F4"
                        />
                        <path
                            d="M2.0667 12.8667c-.2667-.8-.4167-1.6667-.4167-2.55s.15-1.75.4167-2.55l2.6167 2.0333c-.1334.5-.2 1.0334-.2 1.5834 0 .55.0666 1.0833.2 1.5833l-2.6167 1.9z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12.0003 4.7833c2.3167 0 4.3.8334 5.8667 2.2l2.7667-2.7667C18.667 2.3833 15.6336 1.25 12.0003 1.25c-4.45 0-8.35 2.8167-9.8 6.9667l2.6167 2.0333c1.35-4.35 5.3-7.5833 9.9333-7.5833z"
                            fill="#EA4335"
                        />
                        <path
                            d="M4.8167 16.2167c1.35 4.35 5.3 7.5833 9.9333 7.5833 2.3167 0 4.3-.8333 5.8667-2.2l-2.5167-2.25c-1.0333.7-2.3666 1.1-3.35 1.1-2.9166 0-5.3833-2-6.2666-4.8166l-2.6167 2.0166z"
                            fill="#34A853"
                        />
                    </svg>
                    Google (Coming Soon)
                </button>
            </div>
        </div>
    )
}
