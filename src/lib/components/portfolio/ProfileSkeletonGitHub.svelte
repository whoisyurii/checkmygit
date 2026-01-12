<script lang="ts">
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="flex flex-col gap-8 lg:flex-row">
		<!-- Sidebar Skeleton -->
		<aside class="flex w-full flex-col items-center gap-4 text-center lg:w-[296px] lg:flex-shrink-0 lg:items-start lg:text-left">
			<!-- Avatar -->
			<Skeleton variant="circular" width="296px" height="296px" />

			<!-- Name & Username -->
			<div class="w-full space-y-2">
				<Skeleton variant="text" width="180px" height="32px" class="mx-auto lg:mx-0" />
				<Skeleton variant="text" width="120px" height="24px" class="mx-auto lg:mx-0" />
			</div>

			<!-- Bio -->
			<div class="w-full space-y-2">
				<Skeleton variant="text" width="100%" height="16px" />
				<Skeleton variant="text" width="85%" height="16px" />
			</div>

			<!-- Follow Button -->
			<Skeleton variant="rectangular" width="100%" height="40px" />

			<!-- Tags -->
			<div class="flex flex-wrap justify-center gap-2 lg:justify-start">
				<Skeleton variant="rectangular" width="80px" height="24px" class="rounded-full" />
				<Skeleton variant="rectangular" width="90px" height="24px" class="rounded-full" />
				<Skeleton variant="rectangular" width="70px" height="24px" class="rounded-full" />
				<Skeleton variant="rectangular" width="85px" height="24px" class="rounded-full" />
			</div>

			<!-- Meta Info -->
			<div class="w-full space-y-3">
				<div class="flex items-center justify-center gap-2 lg:justify-start">
					<Skeleton variant="rectangular" width="16px" height="16px" />
					<Skeleton variant="text" width="120px" height="14px" />
				</div>
				<div class="flex items-center justify-center gap-2 lg:justify-start">
					<Skeleton variant="rectangular" width="16px" height="16px" />
					<Skeleton variant="text" width="100px" height="14px" />
				</div>
				<div class="flex items-center justify-center gap-2 lg:justify-start">
					<Skeleton variant="rectangular" width="16px" height="16px" />
					<Skeleton variant="text" width="140px" height="14px" />
				</div>
				<div class="flex items-center justify-center gap-2 lg:justify-start">
					<Skeleton variant="rectangular" width="16px" height="16px" />
					<Skeleton variant="text" width="90px" height="14px" />
				</div>
			</div>

			<!-- Followers/Following -->
			<div class="flex items-center justify-center gap-4 lg:justify-start">
				<Skeleton variant="text" width="90px" height="14px" />
				<Skeleton variant="text" width="90px" height="14px" />
			</div>

			<!-- Views -->
			<div class="flex items-center justify-center gap-2 lg:justify-start">
				<Skeleton variant="rectangular" width="16px" height="16px" />
				<Skeleton variant="text" width="70px" height="14px" />
			</div>
		</aside>

		<!-- Main Content Skeleton -->
		<div class="flex-1 space-y-6">
			<!-- Welcome Banner -->
			<Card variant="default" padding="lg">
				<div class="flex items-center justify-between">
					<div class="space-y-2">
						<Skeleton variant="text" width="280px" height="24px" />
						<Skeleton variant="text" width="320px" height="16px" />
					</div>
					<Skeleton variant="text" width="120px" height="14px" />
				</div>
			</Card>

			<!-- Stats Grid -->
			<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{#each Array(4) as _}
					<Card variant="default" padding="md">
						<div class="flex flex-col items-center text-center">
							<Skeleton variant="rectangular" width="20px" height="20px" class="mb-2" />
							<Skeleton variant="text" width="60px" height="36px" class="mb-1" />
							<Skeleton variant="text" width="80px" height="12px" />
						</div>
					</Card>
				{/each}
			</div>

			<!-- Contributions Section -->
			<div>
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Skeleton variant="rectangular" width="20px" height="20px" />
						<Skeleton variant="text" width="120px" height="20px" />
					</div>
					<Skeleton variant="text" width="140px" height="14px" />
				</div>
				<Card variant="default" padding="md">
					<!-- Contribution graph placeholder -->
					<div class="w-full">
						<!-- Month labels row -->
						<div class="mb-2 flex">
							<div class="w-8 shrink-0"></div>
							<div class="flex flex-1 gap-4">
								{#each Array(6) as _}
									<Skeleton variant="text" width="30px" height="10px" />
								{/each}
							</div>
						</div>
						<!-- Graph grid -->
						<div class="flex gap-2">
							<div class="flex w-8 shrink-0 flex-col gap-1">
								{#each Array(7) as _}
									<Skeleton variant="text" width="24px" height="10px" />
								{/each}
							</div>
							<div class="grid flex-1 grid-cols-[repeat(52,1fr)] gap-0.5">
								{#each Array(364) as _}
									<Skeleton variant="rectangular" class="aspect-square rounded-sm" />
								{/each}
							</div>
						</div>
						<Skeleton variant="text" width="140px" height="12px" class="mt-4" />
					</div>
				</Card>
			</div>

			<!-- Tech Stack & Languages Section -->
			<div>
				<div class="mb-4 flex items-center gap-2">
					<Skeleton variant="rectangular" width="20px" height="20px" />
					<Skeleton variant="text" width="180px" height="20px" />
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					<!-- TechStack Skeleton -->
					<Card variant="default" padding="md">
						<div class="space-y-3">
							<Skeleton variant="text" width="100px" height="12px" />
							<div class="space-y-2">
								<Skeleton variant="text" width="100%" height="14px" />
								<Skeleton variant="text" width="90%" height="14px" />
							</div>
							<div class="flex flex-wrap gap-2 pt-2">
								{#each Array(6) as _}
									<Skeleton variant="rectangular" width="70px" height="24px" class="rounded-full" />
								{/each}
							</div>
						</div>
					</Card>
					<!-- LanguageChart Skeleton -->
					<Card variant="default" padding="md">
						<div class="flex items-center gap-6">
							<Skeleton variant="circular" width="120px" height="120px" />
							<div class="flex-1 space-y-3">
								{#each Array(5) as _}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Skeleton variant="circular" width="12px" height="12px" />
											<Skeleton variant="text" width="80px" height="14px" />
										</div>
										<Skeleton variant="text" width="40px" height="14px" />
									</div>
								{/each}
							</div>
						</div>
					</Card>
				</div>
			</div>

			<!-- Notable Projects Section -->
			<div>
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Skeleton variant="rectangular" width="20px" height="20px" />
						<Skeleton variant="text" width="140px" height="20px" />
					</div>
					<Skeleton variant="rectangular" width="120px" height="36px" class="rounded-md" />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each Array(4) as _}
						<!-- ProjectCard Skeleton -->
						<div class="rounded-md border border-border-default bg-bg-secondary p-4">
							<!-- Header -->
							<div class="mb-2 flex items-start justify-between">
								<div class="flex items-center gap-2">
									<Skeleton variant="rectangular" width="16px" height="16px" />
									<Skeleton variant="text" width="120px" height="18px" />
								</div>
								<Skeleton variant="rectangular" width="70px" height="22px" class="rounded-full" />
							</div>
							<!-- Description -->
							<div class="mb-3 space-y-1">
								<Skeleton variant="text" width="100%" height="14px" />
								<Skeleton variant="text" width="80%" height="14px" />
							</div>
							<!-- Topics -->
							<div class="mb-3 flex flex-wrap gap-1">
								<Skeleton variant="rectangular" width="60px" height="20px" class="rounded-full" />
								<Skeleton variant="rectangular" width="70px" height="20px" class="rounded-full" />
								<Skeleton variant="rectangular" width="55px" height="20px" class="rounded-full" />
							</div>
							<!-- Stats -->
							<div class="flex items-center gap-4">
								<div class="flex items-center gap-1">
									<Skeleton variant="rectangular" width="16px" height="16px" />
									<Skeleton variant="text" width="30px" height="12px" />
								</div>
								<div class="flex items-center gap-1">
									<Skeleton variant="rectangular" width="16px" height="16px" />
									<Skeleton variant="text" width="24px" height="12px" />
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
