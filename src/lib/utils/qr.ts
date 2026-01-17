import QRCode from 'qrcode';

export interface QROptions {
	width?: number;
	margin?: number;
	color?: {
		dark?: string;
		light?: string;
	};
}

export async function generateQRCode(url: string, options?: QROptions): Promise<string> {
	return QRCode.toDataURL(url, {
		width: options?.width ?? 300,
		margin: options?.margin ?? 2,
		color: {
			dark: options?.color?.dark ?? '#ffffff',
			light: options?.color?.light ?? '#0d1117'
		},
		errorCorrectionLevel: 'M'
	});
}
