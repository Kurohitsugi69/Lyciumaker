import { Card, Skill } from './card'
import { CanvasTool } from '../entity/CanvasTool'

// Project format version for future compatibility
const PROJECT_VERSION = '1.0'

// Interface for serialized project
export interface SerializedProject {
    version: string
    cardData: {
        // Illustration
        illustrationBase64: string | null // null if no illustration loaded
        illustrationWidth: number
        illustrationHeight: number
        illustrationLoaded: boolean
        
        // Position and size
        x: number
        y: number
        w: number
        h: number
        scale: number
        
        // Display settings
        isProducer: boolean
        isIllustrator: boolean
        isCardNum: boolean
        producer: string
        illastrator: string
        cardNum: string
        
        isTranslate: boolean
        
        // Text content
        title: string
        name: string
        titleX: number
        titleY: number
        nameX: number
        nameY: number
        
        // Fonts
        titleFont: string
        titleFontSize: number
        isTitleBold: boolean
        nameFont: string
        nameFontSize: number
        nameColor: string
        skillNameFont: string
        skillNameFontSize: number
        skillTextFont: string
        skillTextFontSize: number
        comboFont: string
        comboFontSize: number
        
        // Power and traits
        power: string
        isLord: boolean
        dualFrame: string
        heart: number
        isHreatLimit: boolean
        heartLimit: number
        
        // Skills
        numSkill: number
        skills: Array<{ name: string; text: string; isBold: boolean; isItalic: boolean }>
        comboText: string
    }
}

// Convert image element to Base64 string
async function imageToBase64(img: HTMLImageElement): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!img.src) {
            reject(new Error('No image source'))
            return
        }
        
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
        }
        
        const tempImg = new Image()
        tempImg.crossOrigin = 'anonymous'
        tempImg.onload = () => {
            try {
                ctx.drawImage(tempImg, 0, 0)
                resolve(canvas.toDataURL('image/png'))
            } catch (error) {
                reject(new Error('Failed to draw image to canvas: ' + (error instanceof Error ? error.message : String(error))))
            }
        }
        tempImg.onerror = () => {
            reject(new Error('Failed to load image'))
        }
        tempImg.src = img.src
    })
}

// Convert Base64 string to Image element
async function base64ToImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to decode image'))
        img.src = base64
    })
}

// Serialize card to JSON
export async function serializeCard(card: Card): Promise<SerializedProject> {
    let illustrationBase64: string | null = null
    
    if (card.illastration.isLoad && card.illastration.img.src) {
        try {
            illustrationBase64 = await imageToBase64(card.illastration.img)
        } catch (error) {
            console.warn('Failed to serialize illustration:', error)
        }
    }
    
    return {
        version: PROJECT_VERSION,
        cardData: {
            illustrationBase64,
            illustrationWidth: card.illastration.width,
            illustrationHeight: card.illastration.height,
            illustrationLoaded: card.illastration.isLoad,
            
            x: card.x,
            y: card.y,
            w: card.w,
            h: card.h,
            scale: card.scale,
            
            isProducer: card.isProducer,
            isIllustrator: card.isIllustrator,
            isCardNum: card.isCardNum,
            producer: card.producer,
            illastrator: card.illastrator,
            cardNum: card.cardNum,
            
            isTranslate: card.isTranslate,
            
            title: card.title,
            name: card.name,
            titleX: card.titleX,
            titleY: card.titleY,
            nameX: card.nameX,
            nameY: card.nameY,
            
            titleFont: card.titleFont,
            titleFontSize: card.titleFontSize,
            isTitleBold: card.isTitleBold,
            nameFont: card.nameFont,
            nameFontSize: card.nameFontSize,
            nameColor: card.nameColor,
            skillNameFont: card.skillNameFont,
            skillNameFontSize: card.skillNameFontSize,
            skillTextFont: card.skillTextFont,
            skillTextFontSize: card.skillTextFontSize,
            comboFont: card.comboFont,
            comboFontSize: card.comboFontSize,
            
            power: card.power,
            isLord: card.isLord,
            dualFrame: card.dualFrame,
            heart: card.heart,
            isHreatLimit: card.isHreatLimit,
            heartLimit: card.heartLimit,
            
            numSkill: card.numSkill,
            skills: card.skills.map(skill => ({
                name: skill.name,
                text: skill.text,
                isBold: skill.isBold,
                isItalic: skill.isItalic
            })),
            comboText: card.comboText
        }
    }
}

// Deserialize card from JSON
export async function deserializeCard(projectJson: SerializedProject, card: Card, cvt: CanvasTool): Promise<void> {
    const data = projectJson.cardData
    
    // Restore all card properties
    card.x = data.x
    card.y = data.y
    card.w = data.w
    card.h = data.h
    card.scale = data.scale
    
    card.isProducer = data.isProducer
    card.isIllustrator = data.isIllustrator
    card.isCardNum = data.isCardNum
    card.producer = data.producer
    card.illastrator = data.illastrator
    card.cardNum = data.cardNum
    
    card.isTranslate = data.isTranslate
    
    card.title = data.title
    card.name = data.name
    card.titleX = data.titleX ?? card.titleX
    card.titleY = data.titleY ?? card.titleY
    card.nameX = data.nameX ?? card.nameX
    card.nameY = data.nameY ?? card.nameY
    
    card.titleFont = data.titleFont
    card.titleFontSize = data.titleFontSize
    card.isTitleBold = data.isTitleBold
    card.nameFont = data.nameFont
    card.nameFontSize = data.nameFontSize
    card.nameColor = data.nameColor
    card.skillNameFont = data.skillNameFont
    card.skillNameFontSize = data.skillNameFontSize
    card.skillTextFont = data.skillTextFont
    card.skillTextFontSize = data.skillTextFontSize
    card.comboFont = data.comboFont
    card.comboFontSize = data.comboFontSize
    
    card.power = data.power
    card.isLord = data.isLord
    card.dualFrame = data.dualFrame
    card.heart = data.heart
    card.isHreatLimit = data.isHreatLimit
    card.heartLimit = data.heartLimit
    
    card.numSkill = data.numSkill
    card.skills = data.skills.map(skillData => {
        const skill = new Skill(skillData.name, skillData.text)
        skill.isBold = skillData.isBold
        skill.isItalic = skillData.isItalic
        return skill
    })
    card.comboText = data.comboText
    
    // Restore illustration if it exists
    if (data.illustrationBase64 && data.illustrationLoaded) {
        try {
            const img = await base64ToImage(data.illustrationBase64)
            card.illastration.img = img
            card.illastration.width = data.illustrationWidth
            card.illastration.height = data.illustrationHeight
            card.illastration.isLoad = true
        } catch (error) {
            console.error('Failed to deserialize illustration:', error)
            card.illastration.isLoad = false
        }
    }
}

// Validate project JSON structure
export function validateProject(projectJson: any): projectJson is SerializedProject {
    if (!projectJson || typeof projectJson !== 'object') return false
    if (!projectJson.version || !projectJson.cardData) return false
    
    const data = projectJson.cardData
    const requiredFields = [
        'x', 'y', 'w', 'h', 'scale',
        'title', 'name', 'power', 'heart',
        'skills', 'comboText'
    ]
    
    return requiredFields.every(field => field in data)
}
