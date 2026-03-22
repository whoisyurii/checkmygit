// OG Card layout builder for Satori
// Returns a virtual DOM tree that Satori renders to SVG

import type { GitHubProfile } from '$lib/types/github';

function formatNumber(num: number): string {
	if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
	if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
	return num.toString();
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 1).trimEnd() + '…';
}

interface StatItem {
	label: string;
	value: string;
}

function buildStatBox(stat: StatItem) {
	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '16px 0',
				backgroundColor: '#0A0A0A',
				borderRadius: '12px',
				border: '1px solid #222222',
				flex: '1'
			},
			children: [
				{
					type: 'div',
					props: {
						style: {
							fontSize: '30px',
							fontWeight: 700,
							color: '#EDEDED',
							lineHeight: 1.2
						},
						children: stat.value
					}
				},
				{
					type: 'div',
					props: {
						style: {
							fontSize: '12px',
							color: '#666666',
							marginTop: '6px',
							textTransform: 'uppercase',
							letterSpacing: '0.08em',
							fontWeight: 500
						},
						children: stat.label
					}
				}
			]
		}
	};
}

function buildLanguageDot(name: string, color: string, percentage: number) {
	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				alignItems: 'center',
				gap: '8px'
			},
			children: [
				{
					type: 'div',
					props: {
						style: {
							width: '10px',
							height: '10px',
							borderRadius: '50%',
							backgroundColor: color,
							flexShrink: 0
						}
					}
				},
				{
					type: 'div',
					props: {
						style: {
							fontSize: '15px',
							color: '#A1A1A1'
						},
						children: `${name} ${percentage}%`
					}
				}
			]
		}
	};
}

export function buildOGCard(profile: GitHubProfile, avatarDataUrl: string | null) {
	const { user, stats, languages } = profile;
	const displayName = user.name || user.login;
	const bio = user.bio ? truncate(user.bio, 100) : null;
	const topLanguages = languages.slice(0, 4);

	const statItems: StatItem[] = [
		{ label: 'Repos', value: formatNumber(stats.totalRepos) },
		{ label: 'Stars', value: formatNumber(stats.originalStars) },
		{ label: 'Followers', value: formatNumber(stats.followers) },
		{ label: 'Years', value: stats.yearsActive.toString() }
	];

	// Avatar element
	const avatarElement = avatarDataUrl
		? {
				type: 'img',
				props: {
					src: avatarDataUrl,
					width: 96,
					height: 96,
					style: {
						borderRadius: '48px',
						border: '2px solid #333333',
						flexShrink: 0
					}
				}
			}
		: {
				type: 'div',
				props: {
					style: {
						width: '96px',
						height: '96px',
						borderRadius: '48px',
						backgroundColor: '#161616',
						border: '2px solid #333333',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '36px',
						fontWeight: 700,
						color: '#666666',
						flexShrink: 0
					},
					children: displayName.charAt(0).toUpperCase()
				}
			};

	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'column',
				width: '1200px',
				height: '630px',
				backgroundColor: '#030303',
				fontFamily: 'Inter'
			},
			children: [
				// Accent gradient bar
				{
					type: 'div',
					props: {
						style: {
							width: '100%',
							height: '4px',
							background: 'linear-gradient(90deg, #3291FF 0%, #2EA043 50%, #8B5CF6 100%)'
						}
					}
				},

				// Main content — single column, vertically centered
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							flexDirection: 'column',
							flex: 1,
							padding: '40px 64px 0',
							justifyContent: 'center',
							gap: '32px'
						},
						children: [
							// Profile row: avatar + name/username/bio
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										alignItems: 'center',
										gap: '28px'
									},
									children: [
										avatarElement,
										// Name + username + bio column
										{
											type: 'div',
											props: {
												style: {
													display: 'flex',
													flexDirection: 'column',
													gap: '4px',
													flex: 1
												},
												children: [
													{
														type: 'div',
														props: {
															style: {
																fontSize: '34px',
																fontWeight: 700,
																color: '#EDEDED',
																lineHeight: 1.3
															},
															children: truncate(displayName, 28)
														}
													},
													{
														type: 'div',
														props: {
															style: {
																fontSize: '18px',
																color: '#666666'
															},
															children: `@${user.login}`
														}
													},
													...(bio
														? [
																{
																	type: 'div',
																	props: {
																		style: {
																			fontSize: '17px',
																			color: '#A1A1A1',
																			lineHeight: 1.5,
																			marginTop: '4px'
																		},
																		children: bio
																	}
																}
															]
														: [])
												]
											}
										}
									]
								}
							},

							// Stats row — equal width boxes
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										gap: '14px'
									},
									children: statItems.map((stat) => buildStatBox(stat))
								}
							},

							// Languages row
							...(topLanguages.length > 0
								? [
										{
											type: 'div',
											props: {
												style: {
													display: 'flex',
													gap: '24px',
													flexWrap: 'wrap'
												},
												children: topLanguages.map((lang) =>
													buildLanguageDot(lang.name, lang.color, lang.percentage)
												)
											}
										}
									]
								: [])
						]
					}
				},

				// Footer
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '20px 64px 28px',
							borderTop: '1px solid #1A1A1A'
						},
						children: [
							{
								type: 'div',
								props: {
									style: {
										fontSize: '13px',
										color: '#333333'
									},
									children: 'GitHub Portfolio'
								}
							},
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										alignItems: 'center',
										gap: '8px'
									},
									children: [
										{
											type: 'div',
											props: {
												style: {
													width: '8px',
													height: '8px',
													borderRadius: '50%',
													backgroundColor: '#2EA043'
												}
											}
										},
										{
											type: 'div',
											props: {
												style: {
													fontSize: '15px',
													fontWeight: 600,
													color: '#666666'
												},
												children: 'checkmygit.com'
											}
										}
									]
								}
							}
						]
					}
				}
			]
		}
	};
}
