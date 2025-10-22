import { beforeAll, describe, expect, it } from 'vitest'
import {
  createAndFundWallet,
  initializeMint,
  loadFixture,
  mintTo,
  sendTransaction,
} from './fixture'
import {
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { TransactionMetadata } from 'litesvm'
import { serialize } from 'borsh'

const SafeTransferParameters = {
  struct: {
    amount: 'u64',
  },
}

describe('safe transfer', () => {
  const { svm, programId } = loadFixture()
  const payer = createAndFundWallet(svm)

  const decimals = 9
  const supply = 100_000_000_000n

  describe('legacy token', () => {
    const mint = Keypair.generate()
    const from = getAssociatedTokenAddressSync(mint.publicKey, payer.publicKey)

    beforeAll(() => {
      initializeMint(svm, payer, mint, decimals, TOKEN_PROGRAM_ID)
      mintTo(
        svm,
        payer,
        mint.publicKey,
        payer.publicKey,
        supply,
        TOKEN_PROGRAM_ID,
      )
    })

    it('should call safe_transfer successfully', () => {
      const receiver = Keypair.generate()
      const to = getAssociatedTokenAddressSync(
        mint.publicKey,
        receiver.publicKey,
      )
      const params = {
        amount: 1_000_000_000n,
      }

      const instructionDisc = Buffer.from([0])
      const instructionData = serialize(SafeTransferParameters, params)

      const ix = new TransactionInstruction({
        keys: [
          {
            pubkey: payer.publicKey,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: from,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: receiver.publicKey,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: to,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: mint.publicKey,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId,
        data: Buffer.concat([instructionDisc, instructionData]),
      })

      const tx = new Transaction().add(ix)

      const re = sendTransaction(svm, tx, [payer])

      if (re instanceof TransactionMetadata) console.log(re.logs())
      else console.log(re.meta().logs())
      expect(re).instanceOf(TransactionMetadata)
    })
  })

  describe('token 2022', () => {
    const mint = Keypair.generate()
    const from = getAssociatedTokenAddressSync(
      mint.publicKey,
      payer.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )

    beforeAll(() => {
      initializeMint(svm, payer, mint, decimals, TOKEN_2022_PROGRAM_ID)
      mintTo(
        svm,
        payer,
        mint.publicKey,
        payer.publicKey,
        supply,
        TOKEN_2022_PROGRAM_ID,
      )
    })

    it('should call safe_transfer successfully', () => {
      const receiver = Keypair.generate()
      const to = getAssociatedTokenAddressSync(
        mint.publicKey,
        receiver.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      )

      const params = {
        amount: 1_000_000_000n,
      }

      const instructionDisc = Buffer.from([0])
      const instructionData = serialize(SafeTransferParameters, params)

      const ix = new TransactionInstruction({
        keys: [
          {
            pubkey: payer.publicKey,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: from,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: receiver.publicKey,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: to,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: mint.publicKey,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: TOKEN_2022_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId,
        data: Buffer.concat([instructionDisc, instructionData]),
      })

      const tx = new Transaction().add(ix)

      const re = sendTransaction(svm, tx, [payer])

      if (re instanceof TransactionMetadata) console.log(re.logs())
      else console.log(re.meta().logs())
      expect(re).instanceOf(TransactionMetadata)
    })
  })
})
