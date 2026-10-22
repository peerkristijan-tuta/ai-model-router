import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function Output({ streaming, submitted, setStreaming, setCurrentAnswer, currentAnswer, setAnnotationText, streamingHalt, setStreamingHalt }) {
    const [sessionStarted, setSessionStarted] = useState(false);
    const [displayUpload, setDisplayUpload] = useState(false);
    const [displayModel, setDisplayModel] = useState(false);
    const [displayAnswer, setDisplayAnswer] = useState(false);
    const [polledModel, setPolledModel] = useState(null);
    const lastAnswer = useRef(null)

    useEffect(() => {
        let timeout
        const poll = async () => {

            if (polledModel != null) {
                const statusRes = await fetch("http://localhost:8080/receiveAnswerStatus")
                let status = await statusRes.json()
                if (streamingHalt)
                    status = false;

                if (status) {
                    const res = await fetch("http://localhost:8080/receiveAnswer")
                    const text = await res.text()

                    if (text !== lastAnswer.current) {
                        lastAnswer.current = text
                        setCurrentAnswer(text)
                        setDisplayAnswer(true)
                        setDisplayUpload(true)
                    }
                } else {
                    setAnnotationText("Copy")
                    setStreaming(false)
                }
            } else {
                setAnnotationText("")
                setStreaming(false)
                const res = await fetch("http://localhost:8080/receiveUploadConfirmation")
                const val = await res.json()
                if (val) {
                    setSessionStarted(true)
                    setDisplayUpload(true)
                    setDisplayAnswer(false)
                    setDisplayModel(false)

                    let model = null
                    while (!model) {
                        const res2 = await fetch("http://localhost:8080/receiveModelConfirmation")
                        model = await res2.text()
                    }
                    setDisplayModel(true)
                    setPolledModel(model)
                }
            }
            timeout = setTimeout(poll, 500)
        }
        poll()
        return () => clearTimeout(timeout)
    }, [polledModel, streamingHalt])

    useEffect(() => {
        if (currentAnswer) {
            setStreaming(true)
            setAnnotationText("Stop")
        }
    }, [currentAnswer])

    useEffect(() => {
        setPolledModel(null)
        setDisplayAnswer(false)
        setDisplayModel(false)
        setDisplayUpload(false)
        setStreamingHalt(false)
    }, [submitted])

    return (
        <div style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "100%", gridTemplateRows: "10.1% 90.9%", width: "85%", height: "85%", backgroundColor: "#0B3954" }}>
            <div style={{ display: "flex", placeItems: "center", justifyContent: "center", gridColumn: "1", gridRow: "1" }}>
                <h1 style={{ color: "inherit", fontSize: "2rem", fontWeight: "normal", margin: 0 }}>Ask AI Anything</h1>
            </div>
            <div style={{ overflow: "auto", fontSize: "1rem", paddingLeft: "1rem", paddingRight: "1rem", paddingBottom: "1rem", flexDirection: "column", display: "flex", gridColumn: "1", gridRow: "2", ...(sessionStarted ? {} : { alignItems: "center", justifyContent: "center" }) }}>
                {displayUpload && <p style={{marginTop: "0", marginBottom: "0", paddingBottom: "0.1rem"}}>Prompt received.</p>}
                {displayModel && polledModel && <p style={{marginTop: "0", marginBottom: "0", paddingBottom: "0.1rem"}}>The prompt has been directed to {polledModel}.</p>}
                {!sessionStarted && <p style ={{ color: "inherit", fontSize: "2rem", fontWeight: "normal", margin: 0 }}>Awaiting user prompt</p>}
                {displayAnswer && <div className="markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentAnswer}</ReactMarkdown>
                </div>}
            </div>
        </div>
    )
}

export default Output