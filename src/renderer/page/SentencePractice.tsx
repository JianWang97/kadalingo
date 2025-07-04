import React, { useState, useEffect } from "react";
import { SentencePair, Course, Lesson } from "../../data/types";
import {
  RepositoryFactory,
  getStorageConfig,
} from "../../data/repositories/RepositoryFactory";
import { useSpeech } from "../contexts/SpeechContext";
import { useKeyboardSound } from "../contexts/KeyboardSoundContext";
import { Modal } from "../components/common";
import { useFloatingMode } from "../hooks/useFloatingMode";
import { Settings } from "../components/Settings";
import { ProgressService } from "../services/progressService";
import { vocabularyService } from "../services/vocabularyService";

// 移动端检测 hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

interface SentencePracticeProps {
  selectedCourse?: Course | null;
}

const SentencePractice: React.FC<SentencePracticeProps> = ({
  selectedCourse,
}) => {
  // 移动端检测
  const isMobile = useIsMobile();

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
  const [feedback, setFeedback] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [usedSentences, setUsedSentences] = useState<number[]>([]);
  const [wordInputs, setWordInputs] = useState<string[]>([]);
  const [wordResults, setWordResults] = useState<(boolean | null)[]>([]);
  const [showHints, setShowHints] = useState<boolean[]>([]);
  const [shakingInputs, setShakingInputs] = useState<boolean[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // 练习完成状态
  const [isAllSentencesCompleted, setIsAllSentencesCompleted] = useState(false);
  const [completedSentencesCount, setCompletedSentencesCount] = useState(0); // 已完成句子数量

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
  }, [selectedCourse]); // 依赖selectedCourse，当课程改变时重新加载  // 加载指定课时的句子

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
      setSentences(sentencesInLesson); // 获取课时进度，恢复已完成的句子状态
      const progressService = ProgressService.getInstance();
      const progress = await progressService.getLessonProgress(
        courseId,
        lessonId
      );
      console.log("加载课时进度：", progress);
      if (progress && progress.completedSentences.length > 0) {
        // 如果有进度，设置已使用的句子
        console.log("恢复学习进度，已完成句子：", progress.completedSentences);
        setUsedSentences(progress.completedSentences);
        setCompletedSentencesCount(progress.completedSentences.length); // 设置已完成句子数量

        // 检查课时是否已完成
        const isLessonCompleted = await progressService.isLessonCompleted(
          courseId,
          lessonId
        );
        if (isLessonCompleted) {
          // 如果课时已完成，显示练习完成界面
          console.log("课时已完成，显示完成界面");
          setIsAllSentencesCompleted(true);
          setCurrentSentence(null);
        } else {
          setIsAllSentencesCompleted(false);
          // 课时未完成，需要加载下一个句子
          // 在设置完 usedSentences 后立即加载下一句
          const availableSentences = sentencesInLesson.filter(
            (sentence: SentencePair) =>
              !progress.completedSentences.includes(sentence.id)
          );
          if (availableSentences.length > 0) {
            // 按照句子ID排序，选择下一个要练习的句子
            availableSentences.sort((a, b) => a.id - b.id);
            const nextSentence = availableSentences[0];
            console.log("设置下一个要练习的句子：", nextSentence);
            setCurrentSentenceWithAutoPlay(nextSentence);

            // 更新 usedSentences 包含当前正在练习的句子，这样进度条显示正确
            setUsedSentences((prev) => {
              if (!prev.includes(nextSentence.id)) {
                return [...prev, nextSentence.id];
              }
              return prev;
            });

            console.log("查看已经使用的句子（包含当前句子）：", [
              ...progress.completedSentences,
              nextSentence.id,
            ]);
          } else {
            console.log("没有可用句子，设置为null");
            setCurrentSentence(null);
          }
        }
      } else {
        // 重置练习状态
        console.log("没有进度，重置练习状态");
        setUsedSentences([]);
        setCompletedSentencesCount(0); // 重置已完成句子数量
        setIsAllSentencesCompleted(false);
        setCurrentSentence(null);
      }
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
    // 只有在句子加载完成，不在加载状态，且当前句子为空时才自动加载下一句
    // 这样避免在有进度恢复时重复加载
    if (
      sentences.length > 0 &&
      !isLoading &&
      !currentSentence &&
      !isAllSentencesCompleted
    ) {
      loadNextSentence();
    }
  }, [sentences, isLoading, currentSentence, isAllSentencesCompleted]);

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
      setShowHints(Array(parsedTokens.length).fill(false));
      setShakingInputs(Array(parsedTokens.length).fill(false));

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
  }, [currentSentence]); // 全局键盘监听  // 全局键盘监听
  useEffect(() => {
    const handleGlobalKeyPress = async (e: KeyboardEvent) => {
      // 空格键 - 完成后下一句（但要排除输入框内的空格键）
      if (e.key === " " && isCorrect === true) {
        e.preventDefault();
        nextSentence();
      }
      // 空格键 - 练习完成后进入下一节
      if (e.key === " " && isAllSentencesCompleted) {
        e.preventDefault();
        goToNextLesson();
      }
      // Ctrl + ' 或 Ctrl + Quote 或 Ctrl + P - 播放英文发音
      if (
        e.ctrlKey &&
        (e.key === "'" ||
          e.key === "Quote" ||
          e.code === "Quote" ||
          e.key === "p")
      ) {
        e.preventDefault();
        handleSpeakEnglish();
      } // Ctrl + H - 显示答案 (Help的意思，避免与浏览器快捷键冲突)
      if (
        e.ctrlKey &&
        e.key === "h" &&
        (isCorrect === null || isCorrect === false)
      ) {
        e.preventDefault();
        showCorrectAnswer().catch(console.error);
      }

      // Ctrl + R - 重置练习
      // if (e.ctrlKey && e.key === "r") {
      //   e.preventDefault();
      //   resetGame();
      // }
    };

    document.addEventListener("keydown", handleGlobalKeyPress);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyPress);
    };
  }, [isCorrect, wordInputs, isAllSentencesCompleted]);
  // 设置当前句子并触发自动播放
  const setCurrentSentenceWithAutoPlay = (sentence: SentencePair) => {
    setCurrentSentence(sentence);

    // 重置相关状态
    setFeedback("");
    setIsCorrect(null);
    setShowHints(
      Array(parseWordsAndPunctuation(sentence.english).length).fill(false)
    );

    // 自动播放英文（延迟一点时间让UI更新完成）
    if (speechSettings.autoPlay && sentence && !isPlaying) {
      console.log("恢复进度时自动播放检查:", {
        autoPlay: speechSettings.autoPlay,
        hasCurrentSentence: !!sentence,
        isPlaying: isPlaying,
        text: sentence.english,
      });
      setTimeout(() => {
        if (!isPlaying) {
          // 再次检查是否正在播放
          console.log("恢复进度时开始自动播放:", sentence.english);
          speakEnglish(sentence.english);
        } else {
          console.log("恢复进度时跳过自动播放，正在播放中");
        }
      }, 300);
    } else {
      console.log("恢复进度时跳过自动播放:", {
        autoPlay: speechSettings.autoPlay,
        hasCurrentSentence: !!sentence,
        isPlaying: isPlaying,
      });
    }
  };
  const handleSpeakEnglish = () => {
    if (currentSentence && !isPlaying) {
      console.log("手动播放英文:", currentSentence.english);
      speakEnglish(currentSentence.english);
    } else {
      console.log("跳过播放:", {
        hasCurrentSentence: !!currentSentence,
        isPlaying: isPlaying,
      });
    }
  };
  const loadNextSentence = () => {
    if (sentences.length === 0) {
      return; // 没有句子数据时不执行
    }
    const availableSentences = sentences.filter(
      (sentence: SentencePair) => !usedSentences.includes(sentence.id)
    );

    if (availableSentences.length === 0) {
      // 所有句子都练习完了
      setIsAllSentencesCompleted(true);
      return; // 不加载新句子，显示完成界面
    } // 按照句子ID顺序选择下一个句子，确保学习进度的一致性
    availableSentences.sort((a, b) => a.id - b.id);
    const nextSentence = availableSentences[0]; // 总是选择ID最小的未完成句子
    setCurrentSentenceWithAutoPlay(nextSentence);
    setUsedSentences((prev) => [...prev, nextSentence.id]);
    setIsAllSentencesCompleted(false);

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

    // 当用户开始输入时，隐藏当前单词的提示
    if (showHints[idx]) {
      setShowHints((prev) => {
        const newHints = [...prev];
        newHints[idx] = false;
        return newHints;
      });
    }

    // 更新输入状态
    setWordInputs((inputs) => {
      const newInputs = [...inputs];
      newInputs[idx] = value;
      return newInputs;
    }); // 移除实时校验逻辑，只在按空格键时进行校验
    // 这里只更新输入状态，不进行任何校验
  };
  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === " ") {
      e.stopPropagation();
      e.preventDefault();
      playKeySound("space");

      // 如果已经完成，直接进入下一句
      if (isCorrect === true) {
        nextSentence();
        return;
      }

      // 如果是最后一个单词，按空格键检查整个句子
      if (currentSentence) {
        checkSingleWord(idx);
      }
    }
  };
  const checkSingleWord = async (idx: number) => {
    if (!currentSentence) return;

    const parsedTokens = parseWordsAndPunctuation(currentSentence.english);
    const userWord = normalizeWord(wordInputs[idx] || "");
    const correctWord = normalizeWord(parsedTokens[idx]?.word || "");
    const originalWord = parsedTokens[idx]?.word || ""; // 获取原始单词，未经过normalize

    const isWordCorrect = userWord === correctWord;
    
    // 只有当单词不包含单引号时，才更新词汇学习状态
    if (!originalWord.includes("'")) {
      vocabularyService.processWordInput(correctWord, isWordCorrect);
    }

    setWordResults((prev) => {
      const newResults = [...prev];
      newResults[idx] = isWordCorrect;
      return newResults;
    });

    if (isWordCorrect) {
      // 如果不是最后一个单词，自动聚焦到下一个输入框
      if (idx < parsedTokens.length - 1) {
        const nextInput = document.querySelector(
          `input[data-word-index="${idx + 1}"]`
        ) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        // 如果是最后一个单词，检查整句是否都正确
        const allWordsCorrect = wordInputs.every((input, index) => {
          return (
            normalizeWord(input) ===
            normalizeWord(parsedTokens[index]?.word || "")
          );
        });

        if (allWordsCorrect) {
          // 所有单词都正确，设置整体状态
          setIsCorrect(true);
          setFeedback("进入下一句！🎉");

          // 保存学习进度
          if (currentCourse && currentLesson) {
            const progressService = ProgressService.getInstance();
            await progressService.markSentenceCompleted(
              currentCourse.id,
              currentLesson.id,
              currentSentence.id,
              sentences.length
            );
            // 更新已完成句子数量
            setCompletedSentencesCount((prev) => prev + 1);
          }

          // 不自动进入下一句，等待用户手动操作
          // 移除焦点以避免继续输入
          const activeElement = document.activeElement as HTMLInputElement;
          if (activeElement) {
            activeElement.blur();
          }
        }
      }
    } else {
      // 如果单词错误，显示抖动动画
      setShakingInputs((prev) => {
        const newShaking = [...prev];
        newShaking[idx] = true;
        return newShaking;
      });

      // 300ms 后移除抖动动画
      setTimeout(() => {
        setShakingInputs((prev) => {
          const newShaking = [...prev];
          newShaking[idx] = false;
          return newShaking;
        });
      }, 300);
    }
  };
  const showCorrectAnswer = async () => {
    if (!currentSentence) return;

    const parsedTokens = parseWordsAndPunctuation(currentSentence.english);

    // 获取当前焦点的输入框索引
    const activeElement = document.activeElement as HTMLInputElement;
    const currentWordIndex = activeElement?.hasAttribute("data-word-index")
      ? parseInt(activeElement.getAttribute("data-word-index") || "-1")
      : -1;

    // 找到需要提示的单词索引（优先当前焦点，然后是第一个错误的）
    const targetWordIndex = findWordToShow(currentWordIndex, parsedTokens);

    if (targetWordIndex >= 0) {
      // 显示提示
      showHintForWord(targetWordIndex, parsedTokens);
    }
  };

  // 找到需要显示提示的单词
  const findWordToShow = (
    currentIndex: number,
    tokens: { word: string; punctuation: string }[]
  ) => {
    // 检查当前单词是否需要提示
    if (currentIndex >= 0 && currentIndex < tokens.length) {
      const userWord = normalizeWord(wordInputs[currentIndex] || "");
      const correctWord = normalizeWord(tokens[currentIndex]?.word || "");
      if (userWord === "" || userWord !== correctWord) {
        return currentIndex;
      }
    }

    // 找第一个需要填写或错误的单词
    for (let i = 0; i < tokens.length; i++) {
      const userWord = normalizeWord(wordInputs[i] || "");
      const correctWord = normalizeWord(tokens[i]?.word || "");
      if (userWord === "" || userWord !== correctWord) {
        return i;
      }
    }

    return -1;
  };

  // 为指定单词显示提示
  const showHintForWord = (
    wordIndex: number,
    tokens: { word: string; punctuation: string }[]
  ) => {
    const originalWord = tokens[wordIndex]?.word || "";

    // 显示提示
    const newShowHints = [...showHints];
    newShowHints[wordIndex] = true;
    setShowHints(newShowHints);

    // 只有当单词不包含单引号时，才添加到生词本
    const englishQuoteWord = originalWord
        .replace(/[‘’“”]/g, (match) => (match === "‘" || match === "’" ? "'" : '"'));
    vocabularyService.addToNewWords(englishQuoteWord);
    
    
    // 播放声音和读音
    playKeySound("enter");
    if (!isPlaying) {
      speakEnglish(originalWord);
    }

    // 聚焦到该输入框
    setTimeout(() => {
      const targetInput = document.querySelector(
        `input[data-word-index="${wordIndex}"]`
      ) as HTMLInputElement;
      if (targetInput) {
        targetInput.focus();
      }
    }, 100);
  };

  const nextSentence = () => {
    loadNextSentence();
  };

  // 再来一遍 - 重置当前练习
  const restartPractice = async () => {
    // 清除当前课节的进度记录
    if (currentCourse && currentLesson) {
      try {
        const progressService = ProgressService.getInstance();
        await progressService.resetLessonProgress(
          currentCourse.id,
          currentLesson.id
        );
      } catch (err) {
        console.error("Failed to reset lesson progress:", err);
      }
    }

    setUsedSentences([]);
    setCompletedSentencesCount(0);
    setIsAllSentencesCompleted(false);
    loadNextSentence();
  }; // 切换到下一课时
  const goToNextLesson = async () => {
    if (allLessons.length === 0) {
      // 如果没有课程数据，就使用原来的重新开始逻辑
      await restartPractice();
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
      if (selectedCourse) {
        await loadLessonSentences(selectedCourse.id, allLessons[0].id);
      }
    }
  };
  const resetGame = () => {
    setUsedSentences([]);
    setCompletedSentencesCount(0);
    setIsAllSentencesCompleted(false);
    loadNextSentence();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
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
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-300">
            {selectedCourse
              ? `课程"${selectedCourse.name}"暂无练习句子`
              : "暂无练习句子"}
          </div>
        </div>
      </div>
    );
  }
  // 练习完成显示
  if (isAllSentencesCompleted) {
    return (
      <div
        className={`h-full flex items-center justify-center bg-gray-50 ${
          isFloating ? "floating-mode-content drag-region" : ""
        }`}
      >
        {" "}
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="text-5xl mb-6">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            {currentLessonIndex === allLessons.length - 1
              ? "课程全部完成！"
              : "练习完成"}
          </h2>
          <div className="text-gray-600 mb-6 space-y-1">
            <p>完成 {sentences.length} 个句子</p>
            {currentLessonIndex === allLessons.length - 1 &&
              allLessons.length > 1 && (
                <p className="text-green-600 font-medium">
                  🌟 恭喜您完成了全部 {allLessons.length} 个课时！
                </p>
              )}
          </div>{" "}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => restartPractice().catch(console.error)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors no-drag"
            >
              再练一遍
            </button>
            {currentLessonIndex < allLessons.length - 1 && (
              <button
                onClick={goToNextLesson}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 no-drag"
              >
                <span>下一节</span>
                <span className="text-xs bg-purple-500 px-2 py-1 rounded text-purple-100">
                  空格
                </span>
              </button>
            )}
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
      className={`relative min-h-[calc(100vh-3rem)] flex flex-col ${
        isFloating
          ? "floating-mode-content"
          : "bg-gray-50 dark:bg-gray-900 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
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
                      : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"
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
                } bg-gray-100 dark:bg-gray-800 rounded-md`}
              >
                <span
                  className={`text-gray-600 dark:text-gray-200 ${
                    isFloating ? "text-xs" : "text-sm"
                  }`}
                >
                  {selectedCourse.name}
                </span>
                {currentLesson && (
                  <>
                    <span className="text-gray-400 dark:text-gray-500">·</span>
                    <span
                      className={`text-gray-500 dark:text-gray-300 ${
                        isFloating ? "text-xs" : "text-sm"
                      }`}
                    >
                      {currentLesson.title}
                    </span>
                    {allLessons.length > 1 && (
                      <span
                        className={`text-gray-400 dark:text-gray-500 ${
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
                      : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"
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
                  } text-gray-900 dark:text-gray-100 ${
                    isFloating ? "floating-mode-text drag-region" : ""
                  }`}
                >
                  {currentSentence.chinese}
                </p>
              </div>
              {!isFloating && (
                <div
                  className={`text-xs justify-center text-gray-400 ${
                    isFloating ? "drag-region" : ""
                  }`}
                >
                  {/* 难度显示已替换为音标 */}
                  <span className="text-gray-400 dark:text-gray-500 font-semibold">
                    {currentSentence.phonetic || "无音标"}
                  </span>
                </div>
              )}
            </div>{" "}
            {/* 输入框区域 */}
            <div className={`mb-8 ${isFloating ? "drag-region" : ""} relative`}>
              <div
                className={`flex flex-wrap gap-2 justify-center items-baseline w-full ${
                  isFloating ? "drag-region" : ""
                }`}
              >
                {" "}
                {parseWordsAndPunctuation(currentSentence.english).map(
                  (token, idx) => (
                    <div key={idx} className="relative flex items-baseline">
                      {" "}
                      {/* 提示显示区域 - 使用绝对定位不占用布局空间 */}
                      {showHints[idx] && (
                        <div
                          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 ${
                            isFloating ? "text-sm" : "text-base"
                          } text-purple-700 font-semibold bg-purple-50 px-3 py-1.5 rounded-lg shadow-sm border border-purple-200 whitespace-nowrap z-10`}
                          style={{
                            animation: "hint-appear 0.3s ease-out forwards",
                            fontFamily:
                              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            letterSpacing: "0.025em",
                          }}
                        >
                          {token.word}
                        </div>
                      )}{" "}
                      <input
                        type="text"
                        value={wordInputs[idx] || ""}
                        onChange={(e) => handleWordInput(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        data-word-index={idx}
                        className={`px-2 py-1 text-center ${
                          isFloating ? "text-lg" : "text-2xl"
                        } font-bold bg-transparent border-0 border-b-2 focus:outline-none transition-colors no-drag ${
                          isFloating ? "floating-mode-text" : ""
                        } ${shakingInputs[idx] ? "shake-animation" : ""}
                        ${
                          wordResults[idx] === false
                            ? "border-b-red-400 text-red-700"
                            : wordResults[idx] === true
                            ? "border-b-green-400 text-green-700"
                            : "border-b-gray-300 dark:border-b-gray-700 focus:border-b-purple-500 text-gray-800 dark:text-gray-100"
                        }`}
                        style={{
                          width: `${Math.max(
                            token.word.length * (isFloating ? 16 : 24),
                            isFloating ? 80 : 120
                          )}px`,
                          fontFamily:
                            '"Microsoft YaHei", "微软雅黑", sans-serif',
                        }}
                        disabled={isCorrect === true}
                        placeholder=""
                      />
                      {token.punctuation && (
                        <span
                          className={`${
                            isFloating ? "text-xl" : "text-3xl"
                          } text-gray-700 dark:text-gray-200 ml-1 font-bold`}
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

              {/* 反馈信息 - 固定在输入框下方，类似toast */}
              {feedback && (
                <div
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 z-20"
                  style={{
                    animation: "hint-appear 0.3s ease-out forwards",
                  }}
                >
                  <div
                    className={`${
                      isFloating ? "text-sm" : "text-base"
                    } font-medium px-4 py-2 rounded-lg shadow-lg border whitespace-nowrap ${
                      isCorrect === true
                        ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700"
                        : isCorrect === false
                        ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700"
                        : "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900 border-purple-200 dark:border-purple-700"
                    }`}
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      letterSpacing: "0.025em",
                    }}
                  >
                    {feedback}
                  </div>
                </div>
              )}
            </div>
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
      </div>{" "}
      {/* 进度条区域 - 小飘窗模式下隐藏 */}
      {!isFloating && (
        <div className="w-full bg-gray-50 dark:bg-gray-900 px-6 py-3">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            {/* 进度条 */}
            <div className="flex-1 text-center">
              <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">
                {completedSentencesCount} / {sentences.length}
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
                <div
                  className="h-2 bg-gray-400 dark:bg-purple-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      sentences.length > 0
                        ? (completedSentencesCount / sentences.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 底部操作栏 - 适配移动端 */}
      {!isFloating && (
        <div className={`
          flex w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3
          md:px-6 md:py-4
          ${isMobile ? "pb-20" : ""} // 在移动端添加底部间距
        `}>
          <div className="w-full flex items-center justify-between">
            <div className={`
              flex items-center justify-center gap-2 md:gap-3 flex-wrap
              ${isMobile ? "w-full" : "flex-1"}
            `}>
              {/* 播放按钮 */}
              <button
                onClick={handleSpeakEnglish}
                disabled={isPlaying}
                className={`
                  px-3 py-1.5 md:px-4 md:py-2
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm rounded-lg
                  hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors
                  flex items-center gap-1 md:gap-2
                  border border-gray-200 dark:border-gray-700 no-drag
                  ${isMobile ? "flex-1" : ""}
                `}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.776L4.36 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.36l4.023-3.776zM15.657 6.343a1 1 0 011.414 0A8.971 8.971 0 0119 12a8.971 8.971 0 01-1.929 5.657 1 1 0 11-1.414-1.414A6.971 6.971 0 0017 12a6.971 6.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>播放</span>
                {!isMobile && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 dark:text-gray-300">
                    Ctrl+P
                  </span>
                )}
              </button>

              {/* 显示答案按钮 */}
              {(isCorrect === null || isCorrect === false) && (
                <button
                  onClick={() => showCorrectAnswer().catch(console.error)}
                  className={`
                    px-3 py-1.5 md:px-4 md:py-2
                    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm rounded-lg
                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                    flex items-center gap-1 md:gap-2
                    border border-gray-200 dark:border-gray-700 no-drag
                    ${isMobile ? "flex-1" : ""}
                  `}
                >
                  <span>显示答案</span>
                  {!isMobile && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 dark:text-gray-300">
                      Ctrl+H
                    </span>
                  )}
                </button>
              )}

              {/* 下一句按钮 */}
              {isCorrect === true && (
                <button
                  onClick={nextSentence}
                  className={`
                    px-3 py-1.5 md:px-4 md:py-2
                    bg-purple-600 text-white text-sm rounded-lg
                    hover:bg-purple-700 transition-colors
                    flex items-center gap-1 md:gap-2 no-drag
                    ${isMobile ? "flex-1" : ""}
                  `}
                >
                  <span>下一句</span>
                  {!isMobile && (
                    <span className="text-xs bg-purple-500 px-2 py-1 rounded text-purple-100">
                      空格
                    </span>
                  )}
                </button>
              )}

              {/* 切换窗口化按钮 - 移动端隐藏 */}
              {!isMobile && window.electronAPI?.toggleFloatingMode && (
                <button
                  onClick={() => window.electronAPI?.toggleFloatingMode?.()}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 border border-gray-200 dark:border-gray-700 no-drag"
                >
                  <span>切换窗口化</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 dark:text-gray-300">
                    Ctrl+Shift+P
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentencePractice;

// 辅助函数：去除单双引号
const normalizeWord = (word: string) => {
  return word
    .replace(/[‘’"”'"\u2018\u2019\u201C\u201D]/g, "")
    .trim()
    .toLowerCase();
};
