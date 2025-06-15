import React, { useState, useEffect } from "react";
import { SentencePair, Course, Lesson } from "../data/types";
import {
  RepositoryFactory,
  getStorageConfig,
} from "../data/repositories/RepositoryFactory";
import { useSpeech } from "../contexts/SpeechContext";
import { useKeyboardSound } from "../contexts/KeyboardSoundContext";
import { Modal } from "../components/common";
import { useFloatingMode } from "../hooks/useFloatingMode";
import { Settings } from "../components/Settings";
import { ProgressService } from "../services/progressService";

interface SentencePracticeProps {
  selectedCourse?: Course | null;
}

const SentencePractice: React.FC<SentencePracticeProps> = ({
  selectedCourse,
}) => {
  // 课程和课时相关状态
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  // 数据仓储相关状态
  const [sentences, setSentences] = useState<SentencePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用语音服务
  const { speakEnglish, isPlaying, settings: speechSettings } = useSpeech();
  // 使用键盘声音服务
  const { playKeySound } = useKeyboardSound();
  // 检测是否为小飘窗模式
  const isFloating = useFloatingMode();

  const [currentSentence, setCurrentSentence] = useState<SentencePair | null>(
    null
  );
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [usedSentences, setUsedSentences] = useState<number[]>([]);
  const [wordInputs, setWordInputs] = useState<string[]>([]);
  const [wordResults, setWordResults] = useState<(boolean | null)[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // 练习完成状态
  const [isAllSentencesCompleted, setIsAllSentencesCompleted] = useState(false);

  // 数据仓储初始化 - 加载课程和课时信息
  useEffect(() => {
    const initializeCourse = async () => {
      if (!selectedCourse) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const factory = RepositoryFactory.getInstance();
        const config = getStorageConfig();
        const repo = await factory.createRepository(config); // 获取该课程的所有课时
        const lessons = await repo.getLessonsByCourse(selectedCourse.id);
        setCurrentCourse(selectedCourse);
        setAllLessons(lessons);

        if (lessons.length > 0) {
          // 查找当前应该学习的课时（基于进度）
          const progressService = ProgressService.getInstance();
          let resumeLessonIndex = 0;

          // 遍历课时，找到第一个未完成的课时
          for (let i = 0; i < lessons.length; i++) {
            const isCompleted = await progressService.isLessonCompleted(
              selectedCourse.id,
              lessons[i].id
            );
            if (!isCompleted) {
              resumeLessonIndex = i;
              break;
            }
            // 如果所有课时都完成了，则从最后一个课时开始
            if (i === lessons.length - 1) {
              resumeLessonIndex = i;
            }
          }

          setCurrentLessonIndex(resumeLessonIndex);
          setCurrentLesson(lessons[resumeLessonIndex]);

          // 加载对应课时的句子
          await loadLessonSentences(
            selectedCourse.id,
            lessons[resumeLessonIndex].id
          );
        } else {
          setSentences([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize course:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize course data"
        );
        setIsLoading(false);
      }
    };

    initializeCourse();
  }, [selectedCourse]); // 依赖selectedCourse，当课程改变时重新加载
  // 加载指定课时的句子
  const loadLessonSentences = async (courseId: number, lessonId: number) => {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);
      const sentencesInLesson = await repo.getSentencesByLesson(
        courseId,
        lessonId
      );

      // 按句子ID排序，确保每次加载的顺序都一致
      sentencesInLesson.sort((a, b) => a.id - b.id);
      setSentences(sentencesInLesson);

      // 获取课时进度，恢复已完成的句子状态
      const progressService = ProgressService.getInstance();
      const progress = await progressService.getLessonProgress(
        courseId,
        lessonId
      );

      if (progress && progress.completedSentences.length > 0) {
        // 如果有进度，设置已使用的句子
        setUsedSentences(progress.completedSentences);
      } else {
        // 重置练习状态
        setUsedSentences([]);
      }

      setCurrentSentence(null);
      setIsAllSentencesCompleted(false);
    } catch (err) {
      console.error("Failed to load lesson sentences:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load lesson sentences"
      );
    }
  };
  // 切换到上一课时
  const goToPreviousLesson = async () => {
    if (allLessons.length === 0) return;

    if (currentLessonIndex > 0) {
      const prevIndex = currentLessonIndex - 1;
      const prevLesson = allLessons[prevIndex];

      setCurrentLessonIndex(prevIndex);
      setCurrentLesson(prevLesson);

      if (selectedCourse) {
        await loadLessonSentences(selectedCourse.id, prevLesson.id);
      }
    }
  };

  useEffect(() => {
    if (sentences.length > 0 && !isLoading) {
      loadNextSentence();
    }
  }, [sentences, isLoading]);

  // 解析句子，分离单词和标点符号
  const parseWordsAndPunctuation = (sentence: string) => {
    const tokens = sentence.split(" ");
    return tokens.map((token) => {
      // 使用正则表达式分离单词和标点符号
      const match = token.match(/^([a-zA-Z']+)([,;:!?.]*)$/);
      if (match) {
        return {
          word: match[1],
          punctuation: match[2],
        };
      } else {
        // 如果没有标点符号，整个token就是单词
        return {
          word: token,
          punctuation: "",
        };
      }
    });
  };

  useEffect(() => {
    if (currentSentence) {
      const parsedTokens = parseWordsAndPunctuation(currentSentence.english);
      setWordInputs(Array(parsedTokens.length).fill(""));
      setWordResults(Array(parsedTokens.length).fill(null));

      // 自动聚焦到第一个输入框
      setTimeout(() => {
        const firstInput = document.querySelector(
          'input[data-word-index="0"]'
        ) as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
    // eslint-disable-next-line
  }, [currentSentence]);
  // 全局键盘监听
  useEffect(() => {
    const handleGlobalKeyPress = async (e: KeyboardEvent) => {
      // Enter键 - 下一句
      if (e.key === "Enter" && (isCorrect === true || showAnswer)) {
        e.preventDefault();
        nextSentence();
      }

      // Ctrl + ' - 播放英文发音
      if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        handleSpeakEnglish();
      }

      // Ctrl + M - 检查答案
      if (e.ctrlKey && e.key === "m" && isCorrect !== true && !showAnswer) {
        e.preventDefault();
        if (!wordInputs.some((input) => !input.trim())) {
          await checkAnswer();
        }
      }

      // Ctrl + N - 显示答案
      if (e.ctrlKey && e.key === "n" && isCorrect !== true && !showAnswer) {
        e.preventDefault();
        showCorrectAnswer().catch(console.error);
      }

      // Ctrl + R - 重置练习
      if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        resetGame();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyPress);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyPress);
    };
  }, [isCorrect, showAnswer, wordInputs]);
  // 处理播放英文的函数
  const handleSpeakEnglish = () => {
    if (currentSentence) {
      speakEnglish(currentSentence.english);
    }
  };
  const loadNextSentence = () => {
    if (sentences.length === 0) {
      return; // 没有句子数据时不执行
    }
    const availableSentences = sentences.filter(
      (sentence: SentencePair) => !usedSentences.includes(sentence.id)
    );

    let nextSentence: SentencePair;
    if (availableSentences.length === 0) {
      // 所有句子都练习完了
      setIsAllSentencesCompleted(true);
      return; // 不加载新句子，显示完成界面
    } else {
      // 按照句子ID顺序选择下一个句子，确保学习进度的一致性
      availableSentences.sort((a, b) => a.id - b.id);
      nextSentence = availableSentences[0]; // 总是选择ID最小的未完成句子
      setCurrentSentence(nextSentence);
      setUsedSentences((prev) => [...prev, nextSentence.id]);
      setIsAllSentencesCompleted(false);
    }
    setFeedback("");
    setIsCorrect(null);
    setShowAnswer(false);

    // 自动播放英文（延迟一点时间让UI更新完成）
    if (speechSettings.autoPlay && nextSentence) {
      setTimeout(() => {
        speakEnglish(nextSentence.english);
      }, 300);
    }

    // 自动聚焦到第一个输入框
    setTimeout(() => {
      const firstInput = document.querySelector(
        'input[data-word-index="0"]'
      ) as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  };
  const handleWordInput = (idx: number, value: string) => {
    // 播放键盘声音（只在输入新字符时播放）
    const oldValue = wordInputs[idx] || "";
    if (value.length > oldValue.length) {
      playKeySound("normal");
    }

    setWordInputs((inputs) => {
      const newInputs = [...inputs];
      newInputs[idx] = value;
      return newInputs;
    });
  };
  const handleKeyPress = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === " ") {
      e.preventDefault();
      playKeySound("space");
      checkSingleWord(idx);
    } else if (e.key === "Enter") {
      e.preventDefault();
      playKeySound("enter");
      // 只在未完成时检查答案，完成后由全局监听处理
      if (isCorrect !== true && !showAnswer) {
        await checkAnswer();
      }
    }
  };
  const checkSingleWord = (idx: number) => {
    if (!currentSentence) return;

    const parsedTokens = parseWordsAndPunctuation(currentSentence.english);
    const userWord = wordInputs[idx]?.trim().toLowerCase();
    const correctWord = parsedTokens[idx]?.word.toLowerCase();

    const isCorrect = userWord === correctWord;

    setWordResults((prev) => {
      const newResults = [...prev];
      newResults[idx] = isCorrect;
      return newResults;
    });

    if (isCorrect && idx < parsedTokens.length - 1) {
      // 如果正确且不是最后一个单词，跳转到下一个输入框
      const nextInput = document.querySelector(
        `input[data-word-index="${idx + 1}"]`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };
  const checkAnswer = async () => {
    if (!currentSentence) return;
    const parsedTokens = parseWordsAndPunctuation(currentSentence.english);
    let allCorrect = true;
    const results = wordInputs.map((input, idx) => {
      const isWordCorrect =
        input.trim().toLowerCase() === parsedTokens[idx]?.word.toLowerCase();
      if (!isWordCorrect) allCorrect = false;
      return isWordCorrect;
    });
    setWordResults(results);
    setAttempts((prev) => prev + 1);

    if (allCorrect) {
      setIsCorrect(true);
      setFeedback("全部单词正确！🎉");
      setScore((prev) => prev + 1);

      // 保存学习进度
      if (currentCourse && currentLesson) {
        const progressService = ProgressService.getInstance();
        await progressService.markSentenceCompleted(
          currentCourse.id,
          currentLesson.id,
          currentSentence.id,
          true,
          sentences.length
        );
      }
    } else {
      setIsCorrect(false);
      setFeedback("有单词不正确，请检查红色单词");

      // 记录错误尝试
      if (currentCourse && currentLesson) {
        const progressService = ProgressService.getInstance();
        await progressService.markSentenceCompleted(
          currentCourse.id,
          currentLesson.id,
          currentSentence.id,
          false,
          sentences.length
        );
      }
    }
  };
  const showCorrectAnswer = async () => {
    setShowAnswer(true);
    setFeedback(`正确答案：${currentSentence?.english}`);
    if (currentSentence) {
      const parsedTokens = parseWordsAndPunctuation(currentSentence.english);
      const correctWords = parsedTokens.map((token) => token.word);
      setWordInputs(correctWords);
      setWordResults(Array(correctWords.length).fill(true));

      // 当显示答案时，也记录为完成状态（但标记为不正确）
      if (currentCourse && currentLesson) {
        const progressService = ProgressService.getInstance();
        await progressService.markSentenceCompleted(
          currentCourse.id,
          currentLesson.id,
          currentSentence.id,
          false, // 标记为不正确，因为是通过显示答案完成的
          sentences.length
        );
      }
    }
  };
  const nextSentence = () => {
    loadNextSentence();
  };
  // 再来一遍 - 重置当前练习
  const restartPractice = () => {
    setUsedSentences([]);
    setIsAllSentencesCompleted(false);
    loadNextSentence();
  };
  // 切换到下一课时
  const goToNextLesson = async () => {
    if (allLessons.length === 0) {
      // 如果没有课程数据，就使用原来的重新开始逻辑
      restartPractice();
      return;
    }

    if (currentLessonIndex < allLessons.length - 1) {
      const nextIndex = currentLessonIndex + 1;
      const nextLesson = allLessons[nextIndex];

      setCurrentLessonIndex(nextIndex);
      setCurrentLesson(nextLesson);

      if (selectedCourse) {
        await loadLessonSentences(selectedCourse.id, nextLesson.id);
      }
    } else {
      // 已经是最后一课时，可以考虑显示课程完成提示
      console.log("已完成所有课时！");
      // 或者循环回到第一课时
      setCurrentLessonIndex(0);
      setCurrentLesson(allLessons[0]);
      if (selectedCourse) {
        await loadLessonSentences(selectedCourse.id, allLessons[0].id);
      }
    }
  };
  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setUsedSentences([]);
    setIsAllSentencesCompleted(false);
    loadNextSentence();
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "简单";
      case "medium":
        return "中等";
      case "hard":
        return "困难";
      default:
        return "未知";
    }
  };
  // 只在本页面监听 Ctrl+Shift+P 切换窗口化和 Esc 退出窗口化
  useEffect(() => {
    const handleFloatingHotkey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        if (window.electronAPI?.toggleFloatingMode) {
          window.electronAPI.toggleFloatingMode();
        }
      }
      // Esc 键退出窗口化模式
      if (e.key === "Escape" && isFloating) {
        e.preventDefault();
        if (window.electronAPI?.toggleFloatingMode) {
          window.electronAPI.toggleFloatingMode();
        }
      }
    };
    document.addEventListener("keydown", handleFloatingHotkey);
    return () => {
      document.removeEventListener("keydown", handleFloatingHotkey);
    };
  }, [isFloating]);
  // 加载状态显示
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">正在加载数据...</div>
        </div>
      </div>
    );
  }

  // 错误状态显示
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <div className="text-red-600 mb-2">数据加载失败</div>
          <div className="text-gray-500 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }
  // 没有句子数据时显示
  if (sentences.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <div className="text-gray-600">
            {selectedCourse
              ? `课程"${selectedCourse.name}"暂无练习句子`
              : "暂无练习句子"}
          </div>
        </div>
      </div>
    );
  }
  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
  // 练习完成显示
  if (isAllSentencesCompleted) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="text-5xl mb-6">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">练习完成</h2>
          <div className="text-gray-600 mb-6 space-y-1">
            <p>完成 {sentences.length} 个句子</p>
            <p className="text-lg font-medium text-blue-600">
              {score}/{attempts}{" "}
              <span className="text-sm text-gray-500">({accuracy}%)</span>
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={restartPractice}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              再练一遍
            </button>
            <button
              onClick={goToNextLesson}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {allLessons.length > 1 &&
              currentLessonIndex < allLessons.length - 1
                ? "下一节"
                : "继续练习"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!currentSentence) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-pulse text-gray-600">准备练习...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full flex flex-col ${
        isFloating ? "floating-mode-content" : "bg-gray-50"
      }`}
    >
      {/* 小窗模式下的拖动区域 */}
      {isFloating && (
        <div className="absolute inset-0 drag-region" style={{ zIndex: 0 }} />
      )}
      {/* 课程信息显示 */}
      {selectedCourse && !isFloating && (
        <div
          className={`${isFloating ? "py-2 px-2" : "py-3 px-6"} ${
            isFloating ? "drag-region" : ""
          }`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              {/* 上一节按钮 */}
              {currentLesson && allLessons.length > 1 && (
                <button
                  onClick={goToPreviousLesson}
                  disabled={currentLessonIndex === 0}
                  className={`${
                    isFloating ? "p-1" : "p-1.5"
                  } rounded-md transition-colors ${
                    currentLessonIndex === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title="上一节"
                >
                  <svg
                    className={`${isFloating ? "w-4 h-4" : "w-5 h-5"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}{" "}
              {/* 课程课时标题 */}
              <div
                className={`inline-flex items-center gap-2 ${
                  isFloating ? "px-2 py-1" : "px-3 py-1.5"
                } bg-gray-100 rounded-md`}
              >
                <span
                  className={`text-gray-600 ${
                    isFloating ? "text-xs" : "text-sm"
                  }`}
                >
                  {selectedCourse.name}
                </span>
                {currentLesson && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span
                      className={`text-gray-500 ${
                        isFloating ? "text-xs" : "text-sm"
                      }`}
                    >
                      {currentLesson.title}
                    </span>
                    {allLessons.length > 1 && (
                      <span
                        className={`text-gray-400 ${
                          isFloating ? "text-xs" : "text-xs"
                        }`}
                      >
                        ({currentLessonIndex + 1}/{allLessons.length})
                      </span>
                    )}
                  </>
                )}
              </div>
              {/* 下一节按钮 */}
              {currentLesson && allLessons.length > 1 && (
                <button
                  onClick={goToNextLesson}
                  disabled={currentLessonIndex === allLessons.length - 1}
                  className={`${
                    isFloating ? "p-1" : "p-1.5"
                  } rounded-md transition-colors ${
                    currentLessonIndex === allLessons.length - 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title="下一节"
                >
                  <svg
                    className={`${isFloating ? "w-4 h-4" : "w-5 h-5"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}{" "}
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto flex items-center relative z-10">
        <div
          className={`w-full ${isFloating ? "px-2 py-3" : "px-6 py-8"} ${
            isFloating ? "drag-region" : ""
          }`}
        >
          {/* 主要练习区域 */}
          <div
            className={`mx-auto w-full ${
              isFloating ? "max-w-full drag-region" : "max-w-full"
            }`}
          >
            {" "}
            {/* 中文句子 */}
            <div
              className={`text-center ${isFloating ? "mb-4" : "mb-8"} ${
                isFloating ? "drag-region" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center gap-3 ${
                  isFloating ? "mb-1" : "mb-2"
                } ${isFloating ? "drag-region" : ""}`}
              >
                <p
                  className={`${
                    isFloating ? "text-base" : "text-xl"
                  } text-gray-900 ${
                    isFloating ? "floating-mode-text drag-region" : ""
                  }`}
                >
                  {currentSentence.chinese}
                </p>
              </div>
              {!isFloating && (
                <div
                  className={`text-xs text-gray-400 ${
                    isFloating ? "drag-region" : ""
                  }`}
                >
                  {getDifficultyText(currentSentence.difficulty)}
                </div>
              )}
            </div>
            {/* 输入框区域 */}
            <div className={`mb-8 ${isFloating ? "drag-region" : ""}`}>
              <div
                className={`flex flex-wrap gap-2 justify-center items-baseline w-full ${
                  isFloating ? "drag-region" : ""
                }`}
              >
                {parseWordsAndPunctuation(currentSentence.english).map(
                  (token, idx) => (
                    <div key={idx} className="flex items-baseline">
                      <input
                        type="text"
                        value={wordInputs[idx] || ""}
                        onChange={(e) => handleWordInput(idx, e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, idx)}
                        data-word-index={idx}
                        className={`px-2 py-1 text-center ${
                          isFloating ? "text-lg" : "text-2xl"
                        } font-bold bg-transparent border-0 border-b-2 focus:outline-none transition-colors no-drag ${
                          isFloating ? "floating-mode-text" : ""
                        }
                        ${
                          wordResults[idx] === false
                            ? "border-b-red-400 text-red-700"
                            : wordResults[idx] === true
                            ? "border-b-green-400 text-green-700"
                            : "border-b-gray-300 focus:border-b-blue-500 text-gray-800"
                        }`}
                        style={{
                          width: `${Math.max(
                            token.word.length * (isFloating ? 16 : 24),
                            isFloating ? 80 : 120
                          )}px`,
                          fontFamily:
                            '"Microsoft YaHei", "微软雅黑", sans-serif',
                        }}
                        disabled={isCorrect === true || showAnswer}
                        placeholder={showAnswer ? token.word : ""}
                      />
                      {token.punctuation && (
                        <span
                          className={`${
                            isFloating ? "text-xl" : "text-3xl"
                          } text-gray-700 ml-1 font-bold`}
                          style={{
                            fontFamily:
                              '"Microsoft YaHei", "微软雅黑", sans-serif',
                          }}
                        >
                          {token.punctuation}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
            {/* 反馈信息 */}
            {feedback && (
              <div
                className={`text-center mb-6 ${
                  isFloating ? "drag-region" : ""
                }`}
              >
                <p
                  className={`text-sm ${
                    isCorrect === true
                      ? "text-green-600"
                      : isCorrect === false
                      ? "text-red-600"
                      : "text-blue-600"
                  } ${isFloating ? "drag-region" : ""}`}
                >
                  {feedback}
                </p>{" "}
              </div>
            )}
          </div>

          {/* 设置模态框 */}
          <Modal
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="设置"
            maxWidth="max-w-lg"
          >
            <Settings />
          </Modal>
        </div>
      </div>
      {/* 进度条区域 - 小飘窗模式下隐藏 */}
      {!isFloating && (
        <div className="w-full bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* 左侧：得分 */}
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {score}/{attempts}
              </div>
              <div className="text-xs text-gray-500">得分</div>
            </div>

            {/* 中间：进度条 */}
            <div className="flex-1 mx-6 text-center">
              <div className="text-sm text-gray-400 mb-2">
                {usedSentences.length} / {sentences.length}
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-gray-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      sentences.length > 0
                        ? (usedSentences.length / sentences.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* 右侧：准确率 */}
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600">
                {accuracy}%
              </div>{" "}
              <div className="text-xs text-gray-500">准确率</div>
            </div>
          </div>
        </div>
      )}
      {/* 简约的底部操作栏 - 小飘窗模式下隐藏 */}
      {!isFloating && (
        <div className="flex w-full bg-white border-t border-gray-200 px-6 py-4">
          <div className="w-full flex items-center justify-between">
            {/* 左侧和中间的按钮 */}
            <div className="flex items-center justify-center gap-3 flex-1">
              <button
                onClick={handleSpeakEnglish}
                disabled={isPlaying}
                className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2 border border-gray-200 no-drag"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.776L4.36 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.36l4.023-3.776zM15.657 6.343a1 1 0 011.414 0A8.971 8.971 0 0119 12a8.971 8.971 0 01-1.929 5.657 1 1 0 11-1.414-1.414A6.971 6.971 0 0017 12a6.971 6.971 0 00-1.343-4.243 1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>播放</span>{" "}
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                  Ctrl+'
                </span>
              </button>
              {isCorrect !== true && !showAnswer && (
                <>
                  <button
                    onClick={() => checkAnswer()}
                    disabled={wordInputs.some((input) => !input.trim())}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 transition-colors flex items-center gap-2 no-drag"
                  >
                    <span>检查</span>{" "}
                    <span className="text-xs bg-blue-500 px-2 py-1 rounded text-blue-100">
                      Enter
                    </span>
                  </button>
                  <button
                    onClick={() => showCorrectAnswer().catch(console.error)}
                    className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-200 no-drag"
                  >
                    <span>显示答案</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                      Ctrl+N
                    </span>
                  </button>
                </>
              )}
              {(isCorrect === true || showAnswer) && (
                <button
                  onClick={nextSentence}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 no-drag"
                >
                  <span>下一句</span>
                  <span className="text-xs bg-blue-500 px-2 py-1 rounded text-blue-100">
                    Enter
                  </span>
                </button>
              )}
              {
                <button
                  onClick={window.electronAPI.toggleFloatingMode}
                  className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-200 no-drag"
                >
                  <span>切换窗口化</span>{" "}
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                    Ctrl+Shift+P
                  </span>
                </button>
              }
            </div>
          </div>

          {/* 右侧的语音设置按钮和窗口化 */}
          <div className="flex items-center gap-3">
            <Settings
              compact={true}
              onOpenSettings={() => setIsDrawerOpen(true)}
              className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg no-drag"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SentencePractice;
