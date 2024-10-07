import React from 'react'
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react'
import { Button } from "./ui/button"

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-950 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Instagram"
              className="hover:bg-blue-600"
              asChild
            >
              <a href="https://www.instagram.com/abirbhab_" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-5 w-5" />
              </a>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="LinkedIn"
              className="hover:bg-blue-600"
              asChild
            >
              <a href="https://www.linkedin.com/in/abirbhab" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5" />
              </a>
            </Button>
          </div>
          <div className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            <a href="mailto:abirbhab00dasgupta@gmail.com" className="hover:underline">abirbhab00dasgupta@gmail.com</a>
          </div>
          <div className="text-center">
            <p>&copy; 2024 All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer