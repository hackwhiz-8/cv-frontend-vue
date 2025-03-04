import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import simulationArea from '../simulationArea'
import { correctWidth, lineTo, moveTo, rect, fillText } from '../canvasApi'
/**
 * @class
 * Decoder
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope=} scope - Cirucit on which element is drawn
 * @param {string=} dir - direction of element
 * @param {number=} bitWidth - bit width per node.
 * @category modules
 */
import { colors } from '../themer/themer'

export default class Decoder extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'LEFT', bitWidth = 1) {
        super(x, y, scope, dir, bitWidth)
        this.outputsize = 1 << this.bitWidth
        this.xOff = 0
        this.yOff = 1
        if (this.bitWidth === 1) {
            this.xOff = 10
        }
        if (this.bitWidth <= 3) {
            this.yOff = 2
        }
        // eslint-disable-next-line no-shadow
        this.newBitWidth = function (bitWidth) {
            if (bitWidth === undefined || bitWidth < 1 || bitWidth > 32) return
            if (this.bitWidth === bitWidth) return
            const obj = new Decoder(
                this.x,
                this.y,
                this.scope,
                this.direction,
                bitWidth
            )
            this.cleanDelete()
            simulationArea.lastSelected = obj
            return obj
        }

        this.setDimensions(20 - this.xOff, this.yOff * 5 * this.outputsize)
        this.rectangleObject = false
        this.input = new Node(20 - this.xOff, 0, 0, this)

        this.output1 = []
        for (let i = 0; i < this.outputsize; i++) {
            const a = new Node(
                -20 + this.xOff,
                +this.yOff * 10 * (i - this.outputsize / 2) + 10,
                1,
                this,
                1
            )
            this.output1.push(a)
        }
    }

    /**
     * @memberof Decoder
     * fn to create save Json Data of object
     * @return {JSON}
     */
    customSave() {
        const data = {
            constructorParamaters: [this.direction, this.bitWidth],
            nodes: {
                output1: this.output1.map(findNode),
                input: findNode(this.input),
            },
        }
        return data
    }

    /**
     * @memberof Decoder
     * resolve output values based on inputData
     */
    resolve() {
        for (let i = 0; i < this.output1.length; i++) {
            this.output1[i].value = 0
        }
        if (this.input.value !== undefined)
            this.output1[this.input.value].value = 1 // if input is undefined, don't change output
        for (let i = 0; i < this.output1.length; i++) {
            simulationArea.simulationQueue.add(this.output1[i])
        }
    }

    /**
     * @memberof Decoder
     * function to draw element
     */
    customDraw() {
        var ctx = simulationArea.context

        const xx = this.x
        const yy = this.y
        ctx.beginPath()
        ctx.strokeStyle = colors['stroke']
        ctx.lineWidth = correctWidth(4)
        ctx.fillStyle = colors['fill']
        moveTo(
            ctx,
            -20 + this.xOff,
            -this.yOff * 10 * (this.outputsize / 2),
            xx,
            yy,
            this.direction
        )
        lineTo(
            ctx,
            -20 + this.xOff,
            20 + this.yOff * 10 * (this.outputsize / 2 - 1),
            xx,
            yy,
            this.direction
        )
        lineTo(
            ctx,
            20 - this.xOff,
            +this.yOff * 10 * (this.outputsize / 2 - 1) + this.xOff,
            xx,
            yy,
            this.direction
        )
        lineTo(
            ctx,
            20 - this.xOff,
            -this.yOff * 10 * (this.outputsize / 2) - this.xOff + 20,
            xx,
            yy,
            this.direction
        )

        ctx.closePath()
        if (
            (this.hover && !simulationArea.shiftDown) ||
            simulationArea.lastSelected === this ||
            simulationArea.multipleObjectSelections.contains(this)
        ) {
            ctx.fillStyle = colors['hover_select']
        }
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        for (let i = 0; i < this.outputsize; i++) {
            if (this.direction === 'LEFT')
                fillText(
                    ctx,
                    String(i),
                    xx + this.output1[i].x - 7,
                    yy + this.output1[i].y + 2,
                    10
                )
            else if (this.direction === 'RIGHT')
                fillText(
                    ctx,
                    String(i),
                    xx + this.output1[i].x + 7,
                    yy + this.output1[i].y + 2,
                    10
                )
            else if (this.direction === 'UP')
                fillText(
                    ctx,
                    String(i),
                    xx + this.output1[i].x,
                    yy + this.output1[i].y - 5,
                    10
                )
            else
                fillText(
                    ctx,
                    String(i),
                    xx + this.output1[i].x,
                    yy + this.output1[i].y + 10,
                    10
                )
        }
        ctx.fill()
    }

    verilogBaseType() {
        return this.verilogName() + this.output1.length
    }

    //this code to generate Verilog
    generateVerilog() {
        Decoder.selSizes.add(this.bitWidth)
        return CircuitElement.prototype.generateVerilog.call(this)
    }

    static moduleVerilog() {
        var output = ''

        for (var size of Decoder.selSizes) {
            var numOutput = 1 << size
            output += '\n'
            output += 'module Decoder' + numOutput
            output += '('
            for (var j = 0; j < numOutput; j++) {
                output += 'out' + j + ', '
            }
            output += 'sel);\n'

            output += '  output reg '
            for (var j = 0; j < numOutput - 1; j++) {
                output += 'out' + j + ', '
            }
            output += 'out' + (numOutput - 1) + ';\n'

            output += '  input [' + (size - 1) + ':0] sel;\n'
            output += '  \n'

            output += '  always @ (*) begin\n'
            for (var j = 0; j < numOutput; j++) {
                output += '    out' + j + ' = 0;\n'
            }
            output += '    case (sel)\n'
            for (var j = 0; j < numOutput; j++) {
                output += '      ' + j + ' : out' + j + ' = 1;\n'
            }
            output += '    endcase\n'
            output += '  end\n'
            output += 'endmodule\n'
        }

        return output
    }

    //reset the sized before Verilog generation
    static resetVerilog() {
        Decoder.selSizes = new Set()
    }
}

/**
 * @memberof Decoder
 * Help Tip
 * @type {string}
 * @category modules
 */
Decoder.prototype.tooltipText =
    'Decoder ToolTip : Converts coded inputs into coded outputs.'
Decoder.prototype.helplink =
    'https://docs.circuitverse.org/#/chapter4/5muxandplex?id=decoder'
Decoder.prototype.objectType = 'Decoder'
