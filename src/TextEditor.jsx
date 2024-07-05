import React, {useCallback, useEffect, useRef, useState} from 'react';
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {io} from "socket.io-client";
import { useParams } from 'react-router-dom';

const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
]

const TextEditor = () => {

    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();
    const {id: documentId} = useParams();

    // const wrapperRef = useRef();
    // useEffect(()=>{
    //     const quillDiv = document.createElement("div");
    //     wrapperRef.current.append(quillDiv);
    //     new Quill(quillDiv,{theme:"snow"});
    //     //strict mode enabled so this gonna run twice and twice we see the toolbar at start
    //     return () => {
    //         wrapperRef.innerHTML = "";
    //     }
    // },[]);
    //this useEffect was going on getting redered twice below useCallback does not

    const wrapperRef = useCallback((wrapper) => {
        if(wrapper == null)
        return;
        wrapper.innerHTML ="";
        const quillDiv = document.createElement("div");
        wrapper.append(quillDiv);
        const q = new Quill(quillDiv,{theme: "snow", modules: {
            toolbar : TOOLBAR_OPTIONS
        }});
        q.disable();
        q.setText("Loading...")
        setQuill(q);
    },[]);


    useEffect(() => {
      const s = io("http://localhost:3001");
      setSocket(s);
      return () => {
        s.disconnect();
      }
    },[])


    useEffect(() => {
        if(socket == null || quill  == null)
        return;

        const handler = (delta, oldDelta, source) => {
            if(source !== "user")
            return;
            socket.emit("send-changes", delta);
        }

        quill.on("text-change", handler);

        return () => {
            quill.off("text-change",handler);
        }
      },[socket, quill])


      useEffect(() => {
        if(socket == null || quill  == null)
        return;

        const handler = (delta) => {
            quill.updateContents(delta)
        }

        socket.on("receive-changes", handler);

        return () => {
            socket.off("receive-changes",handler);
        }
      },[socket, quill])


      useEffect(() => {
        if(socket == null || quill  == null)
        return;

        socket.once("load-document", document => {
            quill.setContents(document);
            quill.enable();
        })

        socket.emit("get-document", documentId);

      },[socket, quill, documentId])


  return (
    <div className="container" ref={wrapperRef}></div>
  )
}

export default TextEditor
