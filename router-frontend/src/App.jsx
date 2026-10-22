import Input from './Input.jsx'
import Output from './Output.jsx'
import medallion from '/medallion.png'
import frame from '/frame.png'
import { useState, useEffect, useRef } from "react"

function App() {
    document.body.style.margin = "0"
    document.body.style.padding = "0"

    const [submitted, setSubmitted] = useState(0)
    const [streaming, setStreaming] = useState(false)
    const [spinStage, setSpinStage] = useState(null)
    const [currentAnswer, setCurrentAnswer] = useState(null)
    const [annotationText, setAnnotationText] = useState("")
    const [annotationVisibility, setAnnotationVisibility] = useState(false)
    const [streamingHalt, setStreamingHalt] = useState(false)

    useEffect(() => {
        if (streaming) setSpinStage(0)
    }, [streaming])

    return (
        <div>
        <div style={{ overflow: "hidden", pointerEvents: "none", position: "absolute", display: "grid", gridTemplateColumns: "46.9% 6.3% 46.9%", gridTemplateRows: "43.9% 3% 6.3% 46.9%", width: "100%", height: "100%", zIndex: "1"}}>
            <div style={{ gridRow: "1/5", gridColumn: "1", visibility: "hidden"}}/>
            <img style={{ position: "relative", transform: "scale(1.05)", transformOrigin: "top center", objectFit: "cover", gridRow: "1/5", gridColumn: "2", height: "100%", width: "100%" }} src={frame} />
            <div style={{ visibility: annotationVisibility ? "inherit" : "hidden", fontWeight: "700", gridRow: "2", gridColumn: "2", justifyContent: "center", display: "flex"}}>
                {annotationText}
            </div>
            <img 
                style={{ 
                    position: "relative", zIndex: "1", transform: "scale(1.2)", objectFit: "contain", 
                    gridRow: "3", gridColumn: "2", height: "100%", width: "100%", pointerEvents: "auto",
                    animation: spinStage !== null ? `spin${spinStage} 0.75s linear 1 forwards` : "none"
                }}
                onAnimationEnd={() => {
                    if (streaming) setSpinStage(s => (s+1) % 4)
                    else setSpinStage(null)
                }} 
                onClick={() => {
                    if (spinStage !== null)
                        setStreamingHalt(true)
                    else if (currentAnswer)
                        navigator.clipboard.writeText(currentAnswer)
                }}
                onMouseEnter={() => {
                    setAnnotationVisibility(true)
                }}
                onMouseLeave={() => {
                    setAnnotationVisibility(false)
                }}
                src={medallion} 
            />
            <div style={{ gridRow: "1/5", gridColumn: "3", visibility: "hidden"}}/>
        </div>
        <div style={{ display: "grid", gridTemplateRows: "100%", gridTemplateColumns: "50% 50%", width: "100vw", height: "100vh", zIndex: "1" }}>
            <div style={{ display: "flex", gridColumn: "1", gridRow: "1", backgroundColor: "#0B3954", placeItems: "center", justifyContent: "center" }}>
                <Input setSubmitted={setSubmitted}/>
            </div>
            <div style={{ display: "flex", gridColumn: "2", gridRow: "1", backgroundColor: "#087E8B", placeItems: "center", justifyContent: "center" }}>
                <Output streaming={streaming} submitted={submitted} setStreaming={setStreaming} setCurrentAnswer={setCurrentAnswer} currentAnswer={currentAnswer} setAnnotationText={setAnnotationText} setStreamingHalt={setStreamingHalt} streamingHalt={streamingHalt} />
            </div>
        </div>
        </div>
    )
}

export default App