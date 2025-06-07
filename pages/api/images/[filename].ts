import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { filename } = req.query;
  
  // tmpディレクトリから画像を取得
  const imagePath = path.join(process.cwd(), 'tmp', 'images', filename as string);
  
  try {
    // ファイルの存在を確認
    try {
      await fs.stat(imagePath);
    } catch (err) {
      res.status(404).end('ファイルが見つかりません');
      return;
    }
    
    // ファイルを読み込む
    const imageBuffer = await fs.readFile(imagePath);

    // Content-Typeを設定
    const ext = path.extname(filename as string).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 
                     ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                     'image/png';
    
    res.setHeader('Content-Type', mimeType);
    
    // レスポンスを返す
    res.send(imageBuffer);
  } catch (error) {
    console.error('画像取得エラー:', error);
    res.status(500).end('サーバーエラーが発生しました');
  }
}
