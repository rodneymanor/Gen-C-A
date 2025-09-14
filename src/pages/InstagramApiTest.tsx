import React, { useState } from 'react';
import { css } from '@emotion/react';

// Atlassian Design System Icons
import PersonIcon from '@atlaskit/icon/glyph/person';
import VideoIcon from '@atlaskit/icon/glyph/video-filled';
import SearchIcon from '@atlaskit/icon/glyph/search';

import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const pageStyles = css`
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
`;

const headerStyles = css`
  text-align: center;
  margin-bottom: var(--space-8);

  h1 {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  p {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

const formStyles = css`
  margin-bottom: var(--space-6);

  .form-group {
    margin-bottom: var(--space-4);
  }

  .form-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    flex-wrap: wrap;
  }

  .input-container {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    min-width: 250px;

    .handle-icon {
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
  }
`;

const resultStyles = css`
  margin-bottom: var(--space-6);

  .section {
    margin-bottom: var(--space-6);

    h3 {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-3) 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .result-content {
      background: var(--color-surface);
      border: var(--border-default);
      border-radius: var(--radius-large);
      padding: var(--space-4);
      font-family: var(--font-family-monospace);
      font-size: var(--font-size-body-small);
      line-height: var(--line-height-relaxed);
      color: var(--color-text-primary);
      max-height: 400px;
      overflow-y: auto;
      white-space: pre-wrap;
    }

    .user-info {
      background: var(--color-information-50);
      border: 1px solid var(--color-information-200);
      border-radius: var(--radius-large);
      padding: var(--space-4);
      margin-bottom: var(--space-4);

      .user-id {
        font-size: var(--font-size-h5);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin-bottom: var(--space-2);
      }
    }

    .video-count {
      color: var(--color-text-secondary);
      font-size: var(--font-size-body-small);
      margin-bottom: var(--space-3);
    }
  }
`;

const errorStyles = css`
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-200);
  border-radius: var(--radius-large);
  padding: var(--space-4);
  color: var(--color-danger-500);
  font-size: var(--font-size-body);
  margin-bottom: var(--space-6);
`;

interface UserIdResult {
  UserID: number;
  UserName: string;
}

interface VideoResult {
  data: any[];
}

export const InstagramApiTest: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdResponse, setUserIdResponse] = useState<string | null>(null);
  const [videosResponse, setVideosResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setUserId(null);
    setUserIdResponse(null);
    setVideosResponse(null);

    try {
      console.log('🚀 Starting Instagram API test for username:', username.trim());

      // Step 1: Get user ID from username
      const userIdUrl = `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/user_id_by_username?username=${username.trim()}`;
      console.log('📡 Calling first API to get user ID:', userIdUrl);

      const userIdOptions = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e',
          'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com'
        }
      };

      const userIdResponse = await fetch(userIdUrl, userIdOptions);
      console.log('📋 First API response status:', userIdResponse.status);

      const userIdResult = await userIdResponse.text();
      console.log('📄 First API raw response:', userIdResult);
      setUserIdResponse(userIdResult);

      if (!userIdResponse.ok) {
        throw new Error(`First API failed with status ${userIdResponse.status}: ${userIdResult}`);
      }

      // Parse user ID from response
      let parsedUserId;
      try {
        const parsed = JSON.parse(userIdResult) as UserIdResult;
        parsedUserId = parsed.UserID.toString();
        console.log('🆔 Extracted UserID from JSON:', parsedUserId);
        console.log('👤 Username confirmed:', parsed.UserName);
      } catch (parseError) {
        console.log('⚠️ Failed to parse JSON, treating response as direct user ID');
        parsedUserId = userIdResult.trim();
        console.log('🆔 Using direct user ID:', parsedUserId);
      }

      if (!parsedUserId) {
        throw new Error('No user ID found in response');
      }

      setUserId(parsedUserId);
      console.log('✅ User ID successfully obtained:', parsedUserId);

      // Wait 2 seconds to avoid rate limit
      console.log('⏳ Waiting 2 seconds to avoid rate limit...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Get videos using the user ID
      const videosUrl = `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/reels?user_id=${parsedUserId}&include_feed_video=true`;
      console.log('📡 Calling second API to get videos:', videosUrl);

      const videosOptions = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e',
          'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com'
        }
      };

      const videosResponse = await fetch(videosUrl, videosOptions);
      console.log('📋 Second API response status:', videosResponse.status);

      const videosResult = await videosResponse.text();
      console.log('📄 Second API raw response length:', videosResult.length, 'characters');
      console.log('📄 Second API raw response:', videosResult);
      setVideosResponse(videosResult);

      if (!videosResponse.ok) {
        throw new Error(`Second API failed with status ${videosResponse.status}: ${videosResult}`);
      }

      // Try to parse and count videos
      try {
        const parsed = JSON.parse(videosResult) as VideoResult;
        const videoCount = parsed.data?.length || 0;
        console.log('🎥 Successfully parsed videos, found:', videoCount, 'videos');
      } catch (parseError) {
        console.log('⚠️ Could not parse videos response as JSON:', parseError);
      }

      console.log('✅ Instagram API test completed successfully!');

    } catch (error: any) {
      console.error('❌ Instagram API test failed:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getVideoCount = () => {
    if (!videosResponse) return 0;
    try {
      const parsed = JSON.parse(videosResponse) as VideoResult;
      return parsed.data?.length || 0;
    } catch {
      return 0;
    }
  };

  return (
    <div css={pageStyles}>
      <header css={headerStyles}>
        <h1>
          <SearchIcon label="Instagram API Test" />
          Instagram API Test
        </h1>
        <p>Test the Instagram API to get user ID and videos from a username</p>
      </header>

      <Card>
        <form css={formStyles} onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-actions">
              <div className="input-container">
                <PersonIcon className="handle-icon" label="Username" />
                <Input
                  type="text"
                  placeholder="Enter Instagram username (e.g., instagram)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!username.trim() || isLoading}
                iconBefore={<SearchIcon label="" />}
              >
                {isLoading ? 'Testing...' : 'Test API'}
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <div css={errorStyles}>
            Error: {error}
          </div>
        )}

        {userId && (
          <div css={resultStyles}>
            <div className="section">
              <h3>
                <PersonIcon label="User ID" />
                User ID Result
              </h3>
              <div className="user-info">
                <div className="user-id">User ID: {userId}</div>
                <div>Username: @{username}</div>
              </div>
              <div className="result-content">
                {userIdResponse}
              </div>
            </div>
          </div>
        )}

        {videosResponse && (
          <div css={resultStyles}>
            <div className="section">
              <h3>
                <VideoIcon label="Videos" />
                Videos Result
              </h3>
              <div className="video-count">
                Found {getVideoCount()} videos
              </div>
              <div className="result-content">
                {videosResponse}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};