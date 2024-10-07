import React from 'react'
import ResponsiveWhiteboard from './components/responsive-whiteboard'
import Footer from './components/footer'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-800 to-blue-900">
      <main className="container mx-auto p-4">
        <h1 className="text-5xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 drop-shadow-lg">
        Interactive Whiteboard
        </h1>
        <h3 className="text-xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-200 drop-shadow-lg">
        
A collaborative tool for real-time drawing and note-taking
        </h3>
        <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg p-6">
          <ResponsiveWhiteboard />
        </div>
      </main>
      <Footer/>
    </div>
  )
}

export default App