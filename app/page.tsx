import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20 relative">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 mb-6 animate-pulse">
              RWA TOKENIZATION
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              Democratize investment in real world assets through blockchain technology.
              Buy fractional ownership in properties, artworks, and other valuable assets
              on the Mantle Sepolia network.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/assets"
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-bold text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-400/40 transform hover:scale-105"
              >
                Browse Assets
              </Link>
              <Link
                href="/profile"
                className="px-12 py-4 border-2 border-cyan-400 text-cyan-400 rounded-xl hover:bg-cyan-400 hover:text-black transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-cyan-400/25 transform hover:scale-105"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          <h3 className="text-2xl font-bold text-white mb-4">Fractional Ownership</h3>
          <p className="text-gray-300 leading-relaxed">
            Invest in high-value assets with smaller amounts of capital through tokenized shares.
          </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-pink-500/20 hover:border-pink-400/40 transition-all duration-300 group">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          <h3 className="text-2xl font-bold text-white mb-4">Secure & Transparent</h3>
          <p className="text-gray-300 leading-relaxed">
            All transactions are recorded on the blockchain with full transparency and security.
          </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 group">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4V5a1 1 0 011-1h4a1 1 0 011 1v1M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          <h3 className="text-2xl font-bold text-white mb-4">IPFS Document Storage</h3>
          <p className="text-gray-300 leading-relaxed">
            Asset documents and metadata are securely stored on IPFS for decentralized access.
          </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-12 rounded-3xl border border-purple-500/20 mb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-cyan-500/5"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-2xl shadow-purple-500/25 group-hover:shadow-purple-400/40 transition-all duration-300 group-hover:scale-110">
                  1
                </div>
                <h3 className="font-bold text-white mb-3 text-lg">Connect Wallet</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Connect your MetaMask wallet and ensure you're on Mantle Sepolia network.
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-2xl shadow-pink-500/25 group-hover:shadow-pink-400/40 transition-all duration-300 group-hover:scale-110">
                  2
                </div>
                <h3 className="font-bold text-white mb-3 text-lg">Browse Assets</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Explore available real world assets listed on the platform.
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-2xl shadow-cyan-500/25 group-hover:shadow-cyan-400/40 transition-all duration-300 group-hover:scale-110">
                  3
                </div>
                <h3 className="font-bold text-white mb-3 text-lg">Purchase Shares</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Buy fractional ownership shares using MNT on Mantle Sepolia.
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-2xl shadow-purple-500/25 group-hover:shadow-purple-400/40 transition-all duration-300 group-hover:scale-110">
                  4
                </div>
                <h3 className="font-bold text-white mb-3 text-lg">Receive NFT</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Get an NFT representing your ownership stake in the asset.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 p-16 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black text-white mb-6">Ready to Start Investing?</h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join the future of real world asset investment on blockchain. Start your journey today!
            </p>
            <Link
              href="/assets"
              className="inline-block px-12 py-4 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-white/25 transform hover:scale-105"
            >
              Explore Assets Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
