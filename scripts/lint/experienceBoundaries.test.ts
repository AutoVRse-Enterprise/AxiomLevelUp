// @vitest-environment node

import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const eslint = new ESLint({ cwd: process.cwd() })

async function restrictedMessages(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath })
  return result?.messages.filter(({ ruleId }) => ruleId === 'no-restricted-imports') ?? []
}

describe('experience import boundaries', () => {
  it('blocks active or concrete experiences from shared modules', async () => {
    const active = await restrictedMessages(
      "import experience from '@experience'\nvoid experience\n",
      'src/lib/fixture.ts',
    )
    const concrete = await restrictedMessages(
      "import experience from '@/experiences/sanofi'\nvoid experience\n",
      'src/components/fixture.ts',
    )

    expect(active).toHaveLength(1)
    expect(concrete).toHaveLength(1)
  })

  it('allows the composition root and ordinary shared imports', async () => {
    expect(
      await restrictedMessages(
        "import experience from '@experience'\nvoid experience\n",
        'src/app/App.tsx',
      ),
    ).toHaveLength(0)
    expect(
      await restrictedMessages(
        "import { Button } from '@/components/ui'\nvoid Button\n",
        'src/lib/fixture.ts',
      ),
    ).toHaveLength(0)
  })

  it('blocks cross-experience imports in both directions', async () => {
    expect(
      await restrictedMessages(
        "import page from '@/experiences/sanofi/HomePage'\nvoid page\n",
        'src/experiences/default/fixture.ts',
      ),
    ).toHaveLength(1)
    expect(
      await restrictedMessages(
        "import page from '@/experiences/default/routes'\nvoid page\n",
        'src/experiences/sanofi/fixture.ts',
      ),
    ).toHaveLength(1)
  })
})
