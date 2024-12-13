"use client";

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download } from "lucide-react"
import Link from "next/link";
import { Carousel } from "shadcn-ui";
import { Modal } from "shadcn-ui";
import { Filter } from "shadcn-ui";

type Model = {
  id: string
  name: string
}

type SchemaProperty = {
  type: string
  description: string
  default?: any
  minimum?: number
  maximum?: number
}

type Schema = {
  input: {
    properties: Record<string, SchemaProperty>
    required: string[]
  }
}

export default function SimpleImageGenerator() {
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [schema, setSchema] = useState<Schema | null>(null)
  const [inputValues, setInputValues] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [appliedFilter, setAppliedFilter] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [imagesPerPage] = useState<number>(9)

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => setModels(data as Model[]))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedModel) {
      fetch(`/api/schema?model=${selectedModel}`)
        .then((res) => res.json())
        .then((ns) => {
          const newSchema = ns as Schema
          setSchema(newSchema)
          const defaultValues = Object.entries(newSchema.input.properties).reduce((acc, [key, prop]) => {
            if (prop.default !== undefined) acc[key] = prop.default
            return acc
          }, {} as Record<string, any>)
          setInputValues(defaultValues)
        })
        .catch(console.error)
    }
  }, [selectedModel])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch("/api/generate_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, ...inputValues }),
      })
      const newImage = await response.text()
      setGeneratedImages((prevImages) => [...prevImages, newImage])
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedModel, inputValues])

  const isFormValid = useCallback(() => {
    return selectedModel && schema?.input.required.every(field => inputValues[field] !== undefined && inputValues[field] !== '')
  }, [selectedModel, schema, inputValues])

  const handleDownload = useCallback((image: string) => {
    const link = document.createElement('a')
    link.href = image
    link.download = 'generated-image.png'
    link.click()
  }, [])

  const handleImageClick = (image: string) => {
    setSelectedImage(image)
    setIsModalOpen(true)
  }

  const handleFilterChange = (filter: string) => {
    setAppliedFilter(filter)
  }

  const filteredImages = generatedImages.filter(image => image.toLowerCase().includes(searchQuery.toLowerCase()))

  const indexOfLastImage = currentPage * imagesPerPage
  const indexOfFirstImage = indexOfLastImage - imagesPerPage
  const currentImages = filteredImages.slice(indexOfFirstImage, indexOfLastImage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <div className="min-h-screen block md:flex">
      <div className="w-full md:w-1/2 block md:flex flex-col md:h-screen">
        <div className="p-4 bg-white space-y-2">
          <h1 className="text-2xl font-bold">Workers AI Image Generator</h1>
          <h2 className="text-lg mb-8">
            Powered by <a href="https://developers.cloudflare.com/workers-ai" className="text-blue-500 hover:underline">Cloudflare Workers AI</a>.
            Source code available on <a href="https://github.com/kristianfreeman/workers-ai-image-playground" className="text-blue-500 hover:underline">GitHub</a>.&nbsp;
            <Link className="underline" href="/images">See all generated images.</Link>
          </h2>
        </div>
        <div className="flex-grow overflow-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">AI Model</label>
              <Select onValueChange={setSelectedModel} value={selectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select an AI model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {schema && Object.entries(schema.input.properties).map(([key, value]) => (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                  {key.charAt(0).toUpperCase() + key.slice(1)} {schema.input.required.includes(key) && "*"}
                </label>
                <Input
                  id={key}
                  type={value.type === 'integer' || value.type === 'number' ? 'number' : 'text'}
                  placeholder={value.description}
                  value={inputValues[key] || ''}
                  onChange={(e) => setInputValues(prev => ({ ...prev, [key]: e.target.value }))}
                  min={value.minimum}
                  max={value.maximum}
                  required={schema.input.required.includes(key)}
                />
              </div>
            ))}
          </form>
        </div>
        <div className="p-4 bg-white">
          <Button onClick={handleSubmit} disabled={isLoading || !isFormValid()} className="w-full">
            Generate Image
          </Button>
        </div>
      </div>
      <div className="w-full md:w-1/2 block md:flex flex-col items-center justify-center p-4 bg-gray-50">
        <input
          type="text"
          placeholder="Search images..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded mb-4"
        />
        {isLoading ? (
          <Loader2 className="h-16 w-16 animate-spin" />
        ) : currentImages.length > 0 ? (
          <>
            <Carousel>
              {currentImages.map((image, index) => (
                <div key={index} onClick={() => handleImageClick(image)}>
                  <Image src={image} alt={`Generated ${index}`} className={`w-full h-auto rounded-lg shadow-lg mb-4 ${appliedFilter}`} />
                </div>
              ))}
            </Carousel>
            <Button onClick={() => handleDownload(selectedImage!)} className="mt-4">
              <Download className="mr-2 h-4 w-4" /> Download Image
            </Button>
            <div className="flex justify-center space-x-2 mt-4">
              {Array.from({ length: Math.ceil(filteredImages.length / imagesPerPage) }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={`px-4 py-2 border rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">Your generated image will appear here</div>
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedImage && (
          <div className="flex flex-col items-center">
            <Image src={selectedImage} alt="Selected" className={`w-full h-auto rounded-lg shadow-lg mb-4 ${appliedFilter}`} />
            <Filter onChange={handleFilterChange} />
          </div>
        )}
      </Modal>
    </div>
  )
}
