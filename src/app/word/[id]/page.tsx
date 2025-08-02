'use client'

import { useParams } from "next/navigation";

const WordDetail = () => {
    const params = useParams();
    const wordId = params.id as string;
    return (
        <>
            <h1>Word detail: {wordId}</h1>
        </>
    )
}

export default WordDetail;