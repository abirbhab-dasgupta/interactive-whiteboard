import React, { useState, useRef, useEffect } from 'react'
import { Pencil, Eraser, Square, Circle, Type, Image as ImageIcon, Undo, Redo, Save, Upload, Moon, Sun, Plus, Minus, Move, FileX } from 'lucide-react'
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Input } from "./ui/input"
import { Switch } from "./ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"

const ResponsiveWhiteboard = () => {
  const [currentTool, setCurrentTool] = useState('pencil')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [elements, setElements] = useState([])
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [text, setText] = useState('')
  const [textSize, setTextSize] = useState(20)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState(null)
  const [action, setAction] = useState('none')
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)

  const tools = [
    { name: 'pencil', icon: Pencil, tooltip: 'Pencil' },
    { name: 'eraser', icon: Eraser, tooltip: 'Eraser' },
    { name: 'rectangle', icon: Square, tooltip: 'Rectangle' },
    { name: 'circle', icon: Circle, tooltip: 'Circle' },
    { name: 'text', icon: Type, tooltip: 'Text' },
    { name: 'image', icon: ImageIcon, tooltip: 'Upload Image' },
    { name: 'select', icon: Move, tooltip: 'Select/Move' },
  ]

  const colors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ffa500', '#ffd700', '#ff4500', '#da70d6', '#fa8072', '#20b2aa', '#87ceeb', '#7fffd4']

  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctxRef.current = ctx

    // Load saved state from local storage
    const savedState = localStorage.getItem('whiteboardState')
    if (savedState) {
      const { elements: savedElements, isDarkMode: savedIsDarkMode } = JSON.parse(savedState)
      setElements(savedElements)
      setIsDarkMode(savedIsDarkMode)
    }
  }, [])

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = strokeColor
      ctxRef.current.lineWidth = strokeWidth
    }
  }, [strokeColor, strokeWidth])

  useEffect(() => {
    drawElements()
  }, [elements, selectedElement])

  useEffect(() => {
    // Save state to local storage whenever elements or isDarkMode changes
    const stateToSave = { elements, isDarkMode }
    localStorage.setItem('whiteboardState', JSON.stringify(stateToSave))
  }, [elements, isDarkMode])

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e)

    if (currentTool === 'select') {
      const clickedElement = getElementAtPosition(offsetX, offsetY)
      setSelectedElement(clickedElement)
      if (clickedElement) {
        setAction('moving')
        return
      }
    }

    setIsDrawing(true)
    if (currentTool === 'eraser') {
      setElements(prevElements => [
        ...prevElements,
        {
          id: Date.now().toString(),
          type: 'eraser',
          points: [{ x: offsetX, y: offsetY }],
          strokeWidth: strokeWidth
        }
      ])
    } else {
      const newElement = {
        id: Date.now().toString(),
        type: currentTool,
        x: offsetX,
        y: offsetY,
        width: 0,
        height: 0,
        color: strokeColor,
        strokeWidth: strokeWidth,
        points: currentTool === 'pencil' ? [{ x: offsetX, y: offsetY }] : undefined,
      }
      setElements(prevElements => [...prevElements, newElement])
    }
  }

  const draw = (e) => {
    const { offsetX, offsetY } = getCoordinates(e)

    if (action === 'moving' && selectedElement) {
      const newElements = elements.map(el => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            x: offsetX - (selectedElement.width ? selectedElement.width / 2 : 0),
            y: offsetY - (selectedElement.height ? selectedElement.height / 2 : 0),
          }
        }
        return el
      })
      setElements(newElements)
      return
    }

    if (!isDrawing) return

    const index = elements.length - 1
    const updatedElement = { ...elements[index] }

    switch (currentTool) {
      case 'pencil':
      case 'eraser':
        updatedElement.points.push({ x: offsetX, y: offsetY })
        break
      case 'rectangle':
      case 'image':
        updatedElement.width = offsetX - updatedElement.x
        updatedElement.height = offsetY - updatedElement.y
        break
      case 'circle':
        updatedElement.radius = Math.sqrt(
          Math.pow(offsetX - updatedElement.x, 2) + Math.pow(offsetY - updatedElement.y, 2)
        )
        break
    }

    setElements(prevElements => [
      ...prevElements.slice(0, index),
      updatedElement,
      ...prevElements.slice(index + 1),
    ])
  }

  const endDrawing = () => {
    setIsDrawing(false)
    setAction('none')
    saveToHistory()
  }

  const getCoordinates = (e) => {
    if (e.touches && e.touches[0]) {
      const rect = canvasRef.current.getBoundingClientRect()
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      }
    } else {
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY
      }
    }
  }

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...elements])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements(history[historyIndex + 1])
    }
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = dataURL
    link.click()
  }

  const handleLoad = (e) => {
    const file = e.target.files[0]
    if (file && file.type.match('image.*')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const newElement = {
            id: Date.now().toString(),
            type: 'image',
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
            img: img,
          }
          setElements(prevElements => [...prevElements, newElement])
          saveToHistory()
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const increaseTextSize = () => {
    setTextSize(prevSize => Math.min(prevSize + 2, 72))
  }

  const decreaseTextSize = () => {
    setTextSize(prevSize => Math.max(prevSize - 2, 8))
  }

  const drawElements = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    elements.forEach(element => {
      ctx.strokeStyle = element.color
      ctx.fillStyle = element.color
      ctx.lineWidth = element.strokeWidth

      switch (element.type) {
        case 'pencil':
          drawPath(ctx, element.points, element.color, element.strokeWidth)
          break
        case 'eraser':
          drawPath(ctx, element.points, '#FFFFFF', element.strokeWidth)
          break
        case 'rectangle':
          ctx.strokeRect(element.x, element.y, element.width, element.height)
          break
        case 'circle':
          ctx.beginPath()
          ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI)
          ctx.stroke()
          break
        case 'text':
          ctx.font = `${element.textSize}px Arial`
          ctx.fillText(element.text, element.x, element.y)
          break
        case 'image':
          if (element.img) {
            ctx.drawImage(element.img, element.x, element.y, element.width, element.height)
          }
          break
      }
    })

    if (selectedElement) {
      ctx.strokeStyle = 'blue'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      if (selectedElement.width && selectedElement.height) {
        ctx.strokeRect(
          selectedElement.x,
          selectedElement.y,
          selectedElement.width,
          selectedElement.height
        )
      } else if (selectedElement.radius) {
        ctx.beginPath()
        ctx.arc(selectedElement.x, selectedElement.y, selectedElement.radius, 0, 2 * Math.PI)
        ctx.stroke()
      }
      ctx.setLineDash([])
    }
  }

  const drawPath = (ctx, points, color, lineWidth) => {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
  }

  const getElementAtPosition = (x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      if (element.type === 'rectangle' || element.type === 'image') {
        if (
          x >= element.x &&
          x <= element.x + element.width &&
          y >= element.y &&
          y <= element.y + element.height
        ) {
          return element
        }
      } else if (element.type === 'circle') {
        const distance = Math.sqrt(
          Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
        )
        if (distance <= element.radius) {
          return element
        }
      } else if (element.type === 'text') {
        const textWidth = ctxRef.current.measureText(element.text).width
        if (
          x >= element.x &&
          x <= element.x + textWidth &&
          y >= element.y - element.textSize &&
          y <= element.y
        ) {
          return element
        }
      }
    }
    return null
  }

  const resizeImage = (direction) => {
    if (selectedElement && selectedElement.type === 'image') {
      const scaleFactor = direction === 'increase' ? 1.1 : 0.9
      const newElements = elements.map(el => {
        if (el.id === selectedElement.id) {
          return {
            ...el,
            width: el.width * scaleFactor,
            height: el.height * scaleFactor
          }
        }
        return el
      })
      setElements(newElements)
      saveToHistory()
    }
  }

  const newCanvas = () => {
    setElements([])
    setHistory([])
    setHistoryIndex(-1)
    setSelectedElement(null)
    setText('')
    setCurrentTool('pencil')
    setStrokeColor('#000000')
    setStrokeWidth(2)
    setTextSize(20)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    localStorage.removeItem('whiteboardState')
  }

  const handleAddText = () => {
    if (text) {
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const newElement = {
        id: Date.now().toString(),
        type: 'text',
        x: rect.width / 2,
        y: rect.height / 2,
        text,
        color: strokeColor,
        textSize,
      }
      setElements(prevElements => [...prevElements, newElement])
      setText('')
      saveToHistory()
    }
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
        <div className={`flex flex-wrap justify-between items-center p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex flex-wrap space-x-2 mb-2 sm:mb-0">
            {tools.map((tool) => (
              <Tooltip key={tool.name}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setCurrentTool(tool.name)}
                    variant={currentTool === tool.name ? "default" : "outline"}
                    size="icon"
                    className={`w-10 h-10 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}
                  >
                    <tool.icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tool.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="flex flex-wrap space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={undo} variant="outline" size="icon" className={`w-10 h-10 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                  <Undo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={redo} variant="outline" size="icon" className={`w-10 h-10 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                  <Redo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSave} variant="outline" size="icon" className={`w-10 h-10 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                  <Save className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => document.getElementById('fileInput').click()} variant="outline" size="icon" className={`w-10 h-10 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                  <Upload className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload Image</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={newCanvas} variant="outline" size="icon" className={`w-10 h-10 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                  <FileX className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Canvas</p>
              </TooltipContent>
            </Tooltip>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLoad}
            />
            <div className="flex items-center space-x-2">
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className={isDarkMode ? 'bg-blue-600' : 'bg-gray-200'}
              />
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
          </div>
        </div>
        <div className={`flex flex-wrap justify-between items-center p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex flex-wrap space-x-2 mb-2 sm:mb-0">
            {colors.map((color) => (
              <Tooltip key={color}>
                <TooltipTrigger asChild>
                  <button
                    className={`w-8 h-8 rounded-full ${color === strokeColor ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setStrokeColor(color)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{color}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="w-full sm:w-auto flex items-center space-x-2">
            <span className="text-sm">Stroke Width:</span>
            <Slider
              value={[strokeWidth]}
              onValueChange={(value) => setStrokeWidth(value[0])}
              max={20}
              step={1}
              className="w-32"
            />
          </div>
        </div>
        {currentTool === 'text' && (
          <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center space-x-4">
              <Input
                type="text"
                placeholder="Enter text to add to the whiteboard"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`flex-grow ${isDarkMode ? 'bg-gray-700 text-white' : ''}`}
              />
              <Button onClick={handleAddText} variant="outline" className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                Add Text
              </Button>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={decreaseTextSize} variant="outline" size="icon" className={`w-8 h-8 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Decrease Text Size</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-sm w-12 text-center">{textSize}px</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={increaseTextSize} variant="outline" size="icon" className={`w-8 h-8 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Increase Text Size</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
        {selectedElement && selectedElement.type === 'image' && (
          <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => resizeImage('decrease')} variant="outline" size="icon" className={`w-8 h-8 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                    <ArrowsPointingIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Decrease Image Size</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => resizeImage('increase')} variant="outline" size="icon" className={`w-8 h-8 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>
                    <ArrowsPointingOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Increase Image Size</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
        <div className="flex-grow p-4">
          <canvas
            ref={canvasRef}
            className={`w-full h-full border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} rounded`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}

export default ResponsiveWhiteboard