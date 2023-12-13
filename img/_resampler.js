// Credit to https://github.com/felix307253927/resampler/blob/master/Resampler.js
const E = new Float32Array()
export const resampler = (fromSampleRate, toSampleRate, channels = 1, inputBufferSize) => {
	if (!fromSampleRate || !toSampleRate)
		throw new Error("Invalid settings specified for the resampler.")
	if (fromSampleRate == toSampleRate) return a => a
	let ratioWeight = fromSampleRate / toSampleRate, lastWeight = +(fromSampleRate < toSampleRate)
	let outputBuffer = new Float32Array(Math.ceil(inputBufferSize * toSampleRate / fromSampleRate / channels * 1.0000004768371582) + channels*2)
	let lastOutput = new Float32Array(channels)
	if(lastWeight) return buffer => {
		let bufferLength = buffer.length, weight = lastWeight, firstWeight = 0, secondWeight = 0, sourceOffset = 0, outputOffset = 0, channel = 0;
		if ((bufferLength % channels) !== 0)
			throw new Error("Buffer was of incorrect sample length.")
		if (bufferLength <= 0) return E
		for (; weight < 1; weight += ratioWeight) {
			secondWeight = weight % 1
			firstWeight = 1 - secondWeight
			lastWeight = weight % 1
			for (channel = 0; channel < channels; ++channel)
				outputBuffer[outputOffset++] = (lastOutput[channel] * firstWeight) + (buffer[channel] * secondWeight)
		}
		weight--
		for (bufferLength -= channels, sourceOffset = Math.floor(weight) * channels; outputOffset < outputBuffer.length && sourceOffset < bufferLength;) {
			secondWeight = weight % 1
			firstWeight  = 1 - secondWeight
			for (channel = 0; channel < channels; ++channel)
				outputBuffer[outputOffset++] = (buffer[sourceOffset + ((channel > 0) ? (channel) : 0)] * firstWeight) + (buffer[sourceOffset+(channels + channel)] * secondWeight)
			weight += ratioWeight
			sourceOffset = Math.floor(weight) * channels
		}
		for (channel = 0; channel < channels; ++channel)
			lastOutput[channel] = buffer[sourceOffset++]
		return outputBuffer.subarray(0, outputOffset)
	}; else {
		let tailExists = false
		return buffer => {
			tailExists = false
			let bufferLength = buffer.length, output_variable_list, weight = 0, channel = 0, actualPosition = 0, amountToNext = 0, alreadyProcessedTail, outputOffset = 0, currentPosition = 0
			if ((bufferLength % channels) !== 0)
				throw new Error("Buffer was of incorrect sample length.")
			if (bufferLength <= 0) return E
			output_variable_list = []
			alreadyProcessedTail = !tailExists
			tailExists = false
			for (channel = 0; channel < channels; ++channel)
				output_variable_list[channel] = 0;
			do {
				if (alreadyProcessedTail) {
					weight = ratioWeight;
					for (channel = 0; channel < channels; ++channel)
						output_variable_list[channel] = 0
				} else {
					weight = lastWeight;
					for (channel = 0; channel < channels; ++channel)
						output_variable_list[channel] = lastOutput[channel]
					alreadyProcessedTail = true
				}
				while (weight > 0 && actualPosition < bufferLength) {
					amountToNext = 1 + actualPosition - currentPosition
					if (weight >= amountToNext) {
						for (channel = 0; channel < channels; ++channel)
							output_variable_list[channel] += buffer[actualPosition++] * amountToNext
						currentPosition = actualPosition
						weight -= amountToNext
					} else {
						for (channel = 0; channel < channels; ++channel)
							output_variable_list[channel] += buffer[actualPosition + ((channel > 0) ? channel : 0)] * weight;
						currentPosition += weight
						weight = 0
						break
					}
				}
				if (weight === 0) {
					for (channel = 0; channel < channels; ++channel)
						outputBuffer[outputOffset++] = output_variable_list[channel] / ratioWeight
				} else {
					lastWeight = weight
					for (channel = 0; channel < channels; ++channel)
						lastOutput[channel] = output_variable_list[channel]
					tailExists = true
					break
				}
			} while (actualPosition < bufferLength && outputOffset < outputBuffer.length)
			return outputBuffer.subarray(0, outputOffset)
		}
	}
}