import React from 'react';

interface AlignmentTableProps {
  alignment: Array<[number, number]> | any;
  srcText: string;
  trgText: string;
}

// Render semantic alignments using data from sentence transformers model
const renderSemanticAlignments = (semanticAlignments: any[], srcTokens: string[], trgTokens: string[]) => {
  const maxTokens = Math.max(srcTokens.length, trgTokens.length);
  const svgWidth = Math.max(800, maxTokens * 120);
  const svgHeight = 400;
  
  const sourceY = 80;
  const targetY = 320;
  const tokenSpacing = svgWidth / (maxTokens + 1);

  // Color mapping for semantic types
  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'Cụm chủ ngữ': '#1890ff',
      'Cụm động từ': '#722ed1', 
      'Cụm địa điểm': '#13c2c2',
      'Cụm thời gian': '#fa8c16',
      'Cụm tân ngữ': '#52c41a',
      'Cụm từ': '#1890ff',
      'Từ đơn': '#52c41a'
    };
    return colorMap[type] || '#666';
  };

  return (
    <div className="alignment-visualization" style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
             <h4 style={{ marginBottom: '20px', color: '#333', fontSize: '16px', fontWeight: '600' }}>
         🤖 AI Semantic Alignment
       </h4>
       
       <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', fontSize: '14px' }}>
         <div><strong>Tiếng Việt:</strong> <span style={{ color: '#1890ff' }}>{srcTokens.join(' ')}</span></div>
         <div><strong>Tiếng Anh:</strong> <span style={{ color: '#52c41a' }}>{trgTokens.join(' ')}</span></div>
       </div>
      
      <svg width={svgWidth} height={svgHeight} style={{ 
        border: '2px solid #e8e8e8', 
        borderRadius: '8px', 
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Background gradient */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f0f9ff', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f0f8e6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGradient)" />
        
                 {/* Language labels - always Vietnamese → English format */}
         <text x="30" y="30" fontSize="16" fontWeight="bold" fill="#1890ff">🇻🇳 Tiếng Việt</text>
         <text x="30" y="380" fontSize="16" fontWeight="bold" fill="#52c41a">🇺🇸 Tiếng Anh</text>
         
         {/* Separation line */}
        <line x1="0" y1="200" x2={svgWidth} y2="200" stroke="#d9d9d9" strokeWidth="3" strokeDasharray="10,5" />
        <circle cx={svgWidth/2} cy="200" r="8" fill="#1890ff" opacity="0.6" />
        
        {/* Draw semantic alignment connections */}
        {semanticAlignments.map((item, index) => {
          const sourceIndices = Array.isArray(item.source_indices) ? item.source_indices : [];
          const targetIndices = Array.isArray(item.target_indices) ? item.target_indices : [];
          const color = getTypeColor(item.type || 'Từ đơn');
          
          // Calculate average positions
          const avgSrcPos = sourceIndices.reduce((sum: number, idx: number) => sum + idx, 0) / sourceIndices.length;
          const avgTrgPos = targetIndices.reduce((sum: number, idx: number) => sum + idx, 0) / targetIndices.length;
          
          const sourceX = (avgSrcPos + 1) * tokenSpacing;
          const targetX = (avgTrgPos + 1) * tokenSpacing;
          
          const midY = 200;
          const controlY1 = sourceY + 60;
          const controlY2 = targetY - 60;
          
          return (
            <g key={index}>
              {/* Connection curve with glow */}
              <path
                d={`M ${sourceX} ${sourceY + 25} Q ${sourceX} ${controlY1} ${(sourceX + targetX) / 2} ${midY} Q ${targetX} ${controlY2} ${targetX} ${targetY - 25}`}
                fill="none"
                stroke={color}
                strokeWidth="4"
                opacity="0.8"
                filter="url(#glow)"
              />
              
              {/* Arrowhead */}
              <polygon
                points={`${targetX-6},${targetY-30} ${targetX+6},${targetY-30} ${targetX},${targetY-18}`}
                fill={color}
              />
              
              {/* Similarity score */}
              <rect
                x={(sourceX + targetX) / 2 - 20}
                y={midY - 12}
                width="40"
                height="20"
                rx="10"
                fill="white"
                stroke={color}
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                x={(sourceX + targetX) / 2}
                y={midY + 3}
                fontSize="9"
                fill={color}
                textAnchor="middle"
                fontWeight="bold"
              >
                {(item.similarity_score * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
        
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Draw source tokens with semantic highlighting */}
        {srcTokens.map((token, index) => {
          const alignmentItem = semanticAlignments.find(item => 
            item.source_indices && item.source_indices.includes(index)
          );
          const isHighlighted = !!alignmentItem;
          const color = isHighlighted ? getTypeColor(alignmentItem.type) : '#666';
          const isPartOfPhrase = alignmentItem && alignmentItem.source_indices.length > 1;
          
          const x = (index + 1) * tokenSpacing;
          
          return (
            <g key={`src-${index}`}>
              <rect
                x={x - 40}
                y={sourceY - 15}
                width="80"
                height="30"
                rx="15"
                fill={isHighlighted ? color : '#f0f0f0'}
                fillOpacity={isHighlighted ? "0.2" : "0.1"}
                stroke={isHighlighted ? color : '#d9d9d9'}
                strokeWidth={isPartOfPhrase ? "3" : "2"}
                strokeDasharray={isPartOfPhrase ? "none" : "3,3"}
              />
              <text
                x={x}
                y={sourceY + 5}
                fontSize="13"
                fill={isHighlighted ? color : '#666'}
                textAnchor="middle"
                fontWeight={isHighlighted ? "bold" : "normal"}
              >
                {token}
              </text>
              <text
                x={x}
                y={sourceY + 18}
                fontSize="9"
                fill="#999"
                textAnchor="middle"
              >
                [{index}]
              </text>
            </g>
          );
        })}
        
        {/* Draw target tokens with semantic highlighting */}
        {trgTokens.map((token, index) => {
          const alignmentItem = semanticAlignments.find(item => 
            item.target_indices && item.target_indices.includes(index)
          );
          const isHighlighted = !!alignmentItem;
          const color = isHighlighted ? getTypeColor(alignmentItem.type) : '#666';
          const isPartOfPhrase = alignmentItem && alignmentItem.target_indices.length > 1;
          
          const x = (index + 1) * tokenSpacing;
          
          return (
            <g key={`trg-${index}`}>
              <rect
                x={x - 40}
                y={targetY - 15}
                width="80"
                height="30"
                rx="15"
                fill={isHighlighted ? color : '#f0f0f0'}
                fillOpacity={isHighlighted ? "0.2" : "0.1"}
                stroke={isHighlighted ? color : '#d9d9d9'}
                strokeWidth={isPartOfPhrase ? "3" : "2"}
                strokeDasharray={isPartOfPhrase ? "none" : "3,3"}
              />
              <text
                x={x}
                y={targetY + 5}
                fontSize="13"
                fill={isHighlighted ? color : '#666'}
                textAnchor="middle"
                fontWeight={isHighlighted ? "bold" : "normal"}
              >
                {token}
              </text>
              <text
                x={x}
                y={targetY + 18}
                fontSize="9"
                fill="#999"
                textAnchor="middle"
              >
                [{index}]
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Semantic alignment details */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
        <h5 style={{ marginBottom: '15px', color: '#333' }}>🧠 Semantic Alignment Details:</h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          {semanticAlignments.map((item, index) => (
            <div key={index} style={{ 
              padding: '10px', 
              border: `2px solid ${getTypeColor(item.type)}`, 
              borderRadius: '6px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ fontWeight: 'bold', color: getTypeColor(item.type) }}>
                {item.type} ({(item.similarity_score * 100).toFixed(1)}%)
              </div>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                <span style={{ color: '#1890ff' }}>"{item.source_words}"</span> ↔ 
                <span style={{ color: '#52c41a' }}> "{item.target_words}"</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#1890ff', borderRadius: '4px' }}></div>
          <span>Cụm chủ ngữ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#722ed1', borderRadius: '4px' }}></div>
          <span>Cụm động từ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#13c2c2', borderRadius: '4px' }}></div>
          <span>Cụm địa điểm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#fa8c16', borderRadius: '4px' }}></div>
          <span>Cụm thời gian</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#52c41a', borderRadius: '4px' }}></div>
          <span>Từ đơn</span>
        </div>
      </div>
    </div>
  );
};

const AlignmentTable: React.FC<AlignmentTableProps> = ({ alignment, srcText, trgText }) => {
  // Auto-detect and reorder to always show Vietnamese → English
  const vietnamese_chars = new Set('àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ');
  
  const srcIsVietnamese = srcText.split('').some(char => vietnamese_chars.has(char.toLowerCase()));
  const trgIsVietnamese = trgText.split('').some(char => vietnamese_chars.has(char.toLowerCase()));
  
  // Always display Vietnamese first, English second
  let displaySrcText, displayTrgText, needToSwapIndices = false;
  
  if (srcIsVietnamese && !trgIsVietnamese) {
    // Input: VI → EN (keep order)
    displaySrcText = srcText;
    displayTrgText = trgText;
    needToSwapIndices = false;
  } else if (!srcIsVietnamese && trgIsVietnamese) {
    // Input: EN → VI (swap for display)
    displaySrcText = trgText;  // Vietnamese first
    displayTrgText = srcText;  // English second  
    needToSwapIndices = true;  // Need to adjust alignment indices
  } else {
    // Default fallback
    displaySrcText = srcText;
    displayTrgText = trgText;
    needToSwapIndices = false;
  }
  
  const srcTokens = displaySrcText.split(/\s+/).filter(token => token.trim() !== '');
  const trgTokens = displayTrgText.split(/\s+/).filter(token => token.trim() !== '');

  // Validate and normalize alignment data
  let alignmentData: Array<[number, number]> = [];
  
  if (!alignment) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No alignment data available
      </div>
    );
  }

  // Handle different alignment data formats
  let useSemanticData = false;
  let semanticAlignments: any[] = [];
  
  if (Array.isArray(alignment)) {
    // Check if it's new format from semantic alignment model
    if (alignment.length > 0 && typeof alignment[0] === 'object' && alignment[0].source_indices) {
      useSemanticData = true;
      semanticAlignments = alignment;
    } else if (alignment.length > 0 && Array.isArray(alignment[0]) && alignment[0].length === 2) {
      // Old format: array of [srcIdx, trgIdx] pairs
      alignmentData = alignment as Array<[number, number]>;
    }
  }

  if (!useSemanticData && alignmentData.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No valid alignment data found
      </div>
    );
  }

  // Use semantic alignments directly if available
  if (useSemanticData) {
    // Adjust indices if we swapped text order for display
    let adjustedSemanticAlignments = semanticAlignments;
    if (needToSwapIndices) {
      adjustedSemanticAlignments = semanticAlignments.map(align => ({
        ...align,
        // Backend always returns VI→EN, but we're displaying with swapped text
        // So we need to swap indices to match the new display order
        source_indices: align.target_indices,
        target_indices: align.source_indices,
        source_words: align.target_words,
        target_words: align.source_words,
      }));
    }
    return renderSemanticAlignments(adjustedSemanticAlignments, srcTokens, trgTokens);
  }

  // Filter valid alignments (within bounds) for old format
  const validAlignments = alignmentData.filter(([srcIdx, trgIdx]) => 
    typeof srcIdx === 'number' && typeof trgIdx === 'number' &&
    srcIdx >= 0 && srcIdx < srcTokens.length && trgIdx >= 0 && trgIdx < trgTokens.length
  );

  // Create phrase alignments for drawing
  const createPhraseAlignments = () => {
    const phrases: Array<{
      sourceTokens: string[];
      targetTokens: string[];
      sourceIndices: number[];
      targetIndices: number[];
      type: string;
      color: string;
    }> = [];

    // Track which words are already used
    const usedSrcWords = new Set<number>();
    const usedTrgWords = new Set<number>();

    // Group alignments by target words
    const alignmentMap = new Map<number, number[]>();
    validAlignments.forEach(([srcIdx, trgIdx]) => {
      if (!alignmentMap.has(trgIdx)) {
        alignmentMap.set(trgIdx, []);
      }
      alignmentMap.get(trgIdx)!.push(srcIdx);
    });

    // Process each group to identify phrases
    Array.from(alignmentMap.entries())
      .sort((a, b) => Math.min(...a[1]) - Math.min(...b[1]))
      .forEach(([trgIdx, srcIndices]) => {
        srcIndices.sort((a, b) => a - b);
        
        // Check if source words are consecutive (forming a phrase)
        const isConsecutivePhrase = srcIndices.length > 1 && 
          srcIndices.every((idx, i) => i === 0 || idx === srcIndices[i - 1] + 1);
        
        let phraseType = "Từ đơn";
        let color = "#52c41a"; // Green for single words
        
        if (isConsecutivePhrase) {
          const sourceWords = srcIndices.map(idx => srcTokens[idx]);
          const firstWord = sourceWords[0]?.toLowerCase();
          const secondWord = sourceWords[1]?.toLowerCase();
          
          if (firstWord === "chúng" && secondWord === "tôi") {
            phraseType = "Cụm chủ ngữ";
            color = "#1890ff"; // Blue
          } else if (firstWord === "đã" && (secondWord === "học" || secondWord === "làm")) {
            phraseType = "Cụm động từ";
            color = "#722ed1"; // Purple
          } else if (firstWord === "ở" && secondWord === "trường") {
            phraseType = "Cụm địa điểm";
            color = "#13c2c2"; // Cyan
          } else if (firstWord === "cả" && secondWord === "ngày") {
            phraseType = "Cụm thời gian";
            color = "#fa8c16"; // Orange
          } else {
            phraseType = "Cụm từ";
            color = "#1890ff"; // Blue
          }
        } else if (srcIndices.length > 1) {
          phraseType = "Nhiều-một";
          color = "#ff4d4f"; // Red
        }

        phrases.push({
          sourceTokens: srcIndices.map(idx => srcTokens[idx]),
          targetTokens: [trgTokens[trgIdx]],
          sourceIndices: srcIndices,
          targetIndices: [trgIdx],
          type: phraseType,
          color: color
        });

        srcIndices.forEach(idx => usedSrcWords.add(idx));
        usedTrgWords.add(trgIdx);
      });

    return phrases;
  };

  const phrases = createPhraseAlignments();
  
  // Calculate SVG dimensions
  const maxTokens = Math.max(srcTokens.length, trgTokens.length);
  const svgWidth = Math.max(800, maxTokens * 120);
  const svgHeight = 400;
  
  // Calculate positions for tokens
  const sourceY = 80;
  const targetY = 320;
  const tokenSpacing = svgWidth / (maxTokens + 1);

  return (
    <div className="alignment-visualization" style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
      <h4 style={{ marginBottom: '20px', color: '#333', fontSize: '16px', fontWeight: '600' }}>
        🎨 Minh họa căn chỉnh cụm từ ngữ nghĩa
      </h4>
      
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', fontSize: '14px' }}>
        <div><strong>Câu gốc (VI):</strong> <span style={{ color: '#1890ff' }}>{srcText}</span></div>
        <div><strong>Câu dịch (EN):</strong> <span style={{ color: '#52c41a' }}>{trgText}</span></div>
        <div><strong>Số cặp alignment:</strong> {phrases.length}</div>
      </div>
      
      <svg width={svgWidth} height={svgHeight} style={{ 
        border: '2px solid #e8e8e8', 
        borderRadius: '8px', 
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Background gradient */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f0f9ff', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f0f8e6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGradient)" />
        
        {/* Language labels */}
        <text x="30" y="30" fontSize="16" fontWeight="bold" fill="#1890ff">🇻🇳 Tiếng Việt</text>
        <text x="30" y="380" fontSize="16" fontWeight="bold" fill="#52c41a">🇺🇸 Tiếng Anh</text>
        
        {/* Separation line with decoration */}
        <line x1="0" y1="200" x2={svgWidth} y2="200" stroke="#d9d9d9" strokeWidth="3" strokeDasharray="10,5" />
        <circle cx={svgWidth/2} cy="200" r="8" fill="#1890ff" opacity="0.6" />
        
        {/* Draw alignment connections */}
        {phrases.map((phrase, index) => {
          // Calculate average positions for source and target
          const avgSrcPos = phrase.sourceIndices.reduce((sum, idx) => sum + idx, 0) / phrase.sourceIndices.length;
          const avgTrgPos = phrase.targetIndices.reduce((sum, idx) => sum + idx, 0) / phrase.targetIndices.length;
          
          const sourceX = (avgSrcPos + 1) * tokenSpacing;
          const targetX = (avgTrgPos + 1) * tokenSpacing;
          
          // Create smooth curve
          const midY = 200;
          const controlY1 = sourceY + 60;
          const controlY2 = targetY - 60;
          
          return (
            <g key={index}>
              {/* Connection curve with glow effect */}
              <path
                d={`M ${sourceX} ${sourceY + 25} Q ${sourceX} ${controlY1} ${(sourceX + targetX) / 2} ${midY} Q ${targetX} ${controlY2} ${targetX} ${targetY - 25}`}
                fill="none"
                stroke={phrase.color}
                strokeWidth="4"
                opacity="0.8"
                filter="url(#glow)"
              />
              
              {/* Arrowhead */}
              <polygon
                points={`${targetX-6},${targetY-30} ${targetX+6},${targetY-30} ${targetX},${targetY-18}`}
                fill={phrase.color}
              />
              
              {/* Type label with background */}
              <rect
                x={(sourceX + targetX) / 2 - 25}
                y={midY - 12}
                width="50"
                height="20"
                rx="10"
                fill="white"
                stroke={phrase.color}
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                x={(sourceX + targetX) / 2}
                y={midY + 3}
                fontSize="10"
                fill={phrase.color}
                textAnchor="middle"
                fontWeight="bold"
              >
                {phrase.type.replace('Cụm ', '')}
              </text>
            </g>
          );
        })}
        
        {/* Glow filter definition */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Draw source tokens */}
        {srcTokens.map((token, index) => {
          const x = (index + 1) * tokenSpacing;
          const phrase = phrases.find(p => p.sourceIndices.includes(index));
          const isHighlighted = !!phrase;
          const color = phrase?.color || '#666';
          
          return (
            <g key={`src-${index}`}>
              <rect
                x={x - 40}
                y={sourceY - 15}
                width="80"
                height="30"
                rx="15"
                fill={isHighlighted ? color : '#f0f0f0'}
                fillOpacity={isHighlighted ? "0.2" : "0.1"}
                stroke={isHighlighted ? color : '#d9d9d9'}
                strokeWidth="2"
              />
              <text
                x={x}
                y={sourceY + 5}
                fontSize="13"
                fill={isHighlighted ? color : '#666'}
                textAnchor="middle"
                fontWeight={isHighlighted ? "bold" : "normal"}
              >
                {token}
              </text>
              <text
                x={x}
                y={sourceY + 18}
                fontSize="9"
                fill="#999"
                textAnchor="middle"
              >
                [{index}]
              </text>
            </g>
          );
        })}
        
        {/* Draw target tokens */}
        {trgTokens.map((token, index) => {
          const x = (index + 1) * tokenSpacing;
          const phrase = phrases.find(p => p.targetIndices.includes(index));
          const isHighlighted = !!phrase;
          const color = phrase?.color || '#666';
          
          return (
            <g key={`trg-${index}`}>
              <rect
                x={x - 40}
                y={targetY - 15}
                width="80"
                height="30"
                rx="15"
                fill={isHighlighted ? color : '#f0f0f0'}
                fillOpacity={isHighlighted ? "0.2" : "0.1"}
                stroke={isHighlighted ? color : '#d9d9d9'}
                strokeWidth="2"
              />
              <text
                x={x}
                y={targetY + 5}
                fontSize="13"
                fill={isHighlighted ? color : '#666'}
                textAnchor="middle"
                fontWeight={isHighlighted ? "bold" : "normal"}
              >
                {token}
              </text>
              <text
                x={x}
                y={targetY + 18}
                fontSize="9"
                fill="#999"
                textAnchor="middle"
              >
                [{index}]
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#1890ff', borderRadius: '4px' }}></div>
          <span>Cụm chủ ngữ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#722ed1', borderRadius: '4px' }}></div>
          <span>Cụm động từ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#13c2c2', borderRadius: '4px' }}></div>
          <span>Cụm địa điểm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#fa8c16', borderRadius: '4px' }}></div>
          <span>Cụm thời gian</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#52c41a', borderRadius: '4px' }}></div>
          <span>Từ đơn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#ff4d4f', borderRadius: '4px' }}></div>
          <span>Nhiều-một</span>
        </div>
      </div>
    </div>
  );
};

export default AlignmentTable; 