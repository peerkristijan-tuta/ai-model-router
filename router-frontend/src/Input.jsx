import cross from '/cross.png'
import { useState, useRef } from "react"

function Input({ setSubmitted }) {
    const [files, setFiles] = useState([
        { id: 0, file: null, column: null },
        { id: 1, file: null, column: null },
        { id: 2, file: null, column: null },
        { id: 3, file: null, column: null },
    ])

    const incr = useRef(1)
    const prompt = useRef(null)
    const [hoveredFile, setHoveredFile] = useState(null)

    return (
        <div style={{ display: "grid", gridTemplateRows: "80% 20%", gridTemplateColumns: "10% 80% 10%", width: "85%", height: "85%", backgroundColor: "#087E8B"}}>
            <div style={{ gridColumn: "2", gridRow: "1" }}>
                <p style={{ fontSize: "2rem", textAlign: "center" }}>Enter prompt</p>
                <textarea ref={prompt} style={{ boxSizing: "border-box", fontSize: "2rem", height: "80%", width: "100%", outline: "none", background: "transparent", border: "3px solid #BFD7EA", resize: "none", color: "#BFD7EA" }}/>
            </div>
            <div style={{ gridColumn: "2", gridRow: "2", display: "grid", gridTemplateColumns: "100%", gridTemplateRows: "40% 60%", width: "100%" }}>
                <div>
                    <button 
                        onClick={() => {
                            if (!prompt.current.value) return
                            const formData = new FormData()
                            formData.append("prompt", prompt.current.value)
                            files.forEach(f => {
                                if (f.file !== null) formData.append("files", f.file)
                            })
                            fetch("http://localhost:8080/prompt", {
                                method: "POST",
                                body: formData
                            })
                            setSubmitted(s => s + 1)
                        }}
                        style={{ width: "100%", height: "100%", backgroundColor: "#BFD7EA", color: "#087E8B", border: "none", fontSize: hoveredFile ? "1.5rem" : "2rem" }}>{ hoveredFile ?? "Submit" }</button>
                </div>
                <div style={{ gridRow: "2", gridColumn: "1", display: "grid", gridTemplateRows: "100%", gridTemplateColumns: "20% 20% 20% 20% 20%", alignItems: "center"}}>
                    <label style={{ justifySelf: "center", height: "70%", gridColumn: "1", gridRow: "1", border: "1px solid #BFD7EA", width: "80%" }}>
                        <input type="file" onChange = {
                            e => {
                                const inputFile = files.find(f => f.file === null)
                                if (inputFile) {
                                    setFiles(files.map(file => {
                                        if (file.id == inputFile.id) { 
                                            return { ...file, column: incr.current++, file: e.target.files[0] }
                                        }
                                        return file
                                    }))
                                }
                                e.target.value = ""
                            }
                        } style={{ display: "none" }}/>
                        <img style={{ gridRow: "1", gridColumn: "2", height: "100%", width: "100%" }} src={cross} />
                    </label>
                    {[0, 1, 2, 3].map(i => {
                        const file = files.find(file => file.id === i)
                        return file.file !== null && 
                        <button 
                            onMouseEnter={e => {
                                e.currentTarget.textContent = "Remove"
                                e.currentTarget.style.fontSize = "1.5rem"
                                e.currentTarget.style.color = "#FF5A5F"
                                e.currentTarget.style.backgroundColor = "#BFD7EA"
                                setHoveredFile(file.file.name)
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.textContent = String(file.column-1)
                                e.currentTarget.style.fontSize = "2rem"
                                e.currentTarget.style.color = "#BFD7EA"
                                e.currentTarget.style.backgroundColor = "#087E8B"
                                setHoveredFile(null)
                            }}
                            onClick={() => {
                                const removed = file.column
                                setFiles(files.map(f => {
                                    if (f.id === file.id) return { ...f, file: null, column: null}
                                    if (f.column > removed) return { ...f, column: f.column - 1 }
                                    return f
                                }))
                                incr.current--
                                setHoveredFile(null)
                            }}
                            key={i} style={{ justifySelf: "center", padding: "0", fontSize: "2rem", backgroundColor: "#087E8B", color: "#BFD7EA", gridRow: "1", gridColumn: String(file.column), height: "70%", width: "80%", border: "1px solid #BFD7EA"}}>
                            {file.column-1}
                        </button>
                    })}
                </div>
            </div>
        </div>
    )
}

export default Input