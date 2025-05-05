#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# InfluxDB 配置
INFLUXDB_ORG="nwafu"
INFLUXDB_BUCKET="k6-bucket"
INFLUXDB_TOKEN="kmtK4nbkKAlN1kMwsVN2IBXm73MchovyHig_kIpovqRGvSxqtdpXsy4kpmz-Y1L-LQRLOrUBAzaVclc4yg0oQA=="
INFLUXDB_ADDR="http://localhost:8086"

# 显示帮助信息
show_help() {
  echo -e "${GREEN}使用方法:${NC}"
  echo "  $0 [选项] <测试文件路径>"
  echo ""
  echo -e "${GREEN}选项:${NC}"
  echo "  -h, --help    显示帮助信息"
  echo "  -o, --output  指定输出目录 (默认: output/results)"
  echo "  --org         设置 InfluxDB 组织名称"
  echo "  --bucket      设置 InfluxDB bucket 名称"
  echo "  --token       设置 InfluxDB token"
  echo "  --addr        设置 InfluxDB 地址"
  echo ""
  echo -e "${GREEN}示例:${NC}"
  echo "  $0 output/login-test.js"
  echo "  $0 -o output/custom-results output/login-test.js"
  echo "  $0 --org myorg --bucket mybucket --token mytoken --addr http://localhost:8086 output/login-test.js"
  exit 0
}

# 默认参数
OUTPUT_DIR="output/results"
TEST_FILES=()

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
  -h | --help)
    show_help
    ;;
  -o | --output)
    OUTPUT_DIR="$2"
    shift 2
    ;;
  --org)
    INFLUXDB_ORG="$2"
    shift 2
    ;;
  --bucket)
    INFLUXDB_BUCKET="$2"
    shift 2
    ;;
  --token)
    INFLUXDB_TOKEN="$2"
    shift 2
    ;;
  --addr)
    INFLUXDB_ADDR="$2"
    shift 2
    ;;
  *)
    TEST_FILES+=("$1")
    shift
    ;;
  esac
done

# 检查是否提供了测试文件
if [ ${#TEST_FILES[@]} -eq 0 ]; then
  echo -e "${RED}错误: 请提供至少一个测试文件${NC}"
  show_help
  exit 1
fi

# 创建测试结果目录
mkdir -p "$OUTPUT_DIR"

# 打印测试开始信息
echo -e "${GREEN}开始性能测试...${NC}"
echo -e "${YELLOW}当前时间: $(date)${NC}"
echo -e "${YELLOW}输出目录: $OUTPUT_DIR${NC}"

# 运行测试
for test_file in "${TEST_FILES[@]}"; do
  if [ ! -f "$test_file" ]; then
    echo -e "${RED}错误: 测试文件不存在: $test_file${NC}"
    continue
  fi

  # 从文件名生成结果文件名
  test_name=$(basename "$test_file" .js)
  result_file="${OUTPUT_DIR}/${test_name}.json"
  summary_file="${OUTPUT_DIR}/${test_name}-summary.json"
  csv_file="${OUTPUT_DIR}/${test_name}.csv"

  echo -e "\n${GREEN}运行测试: $test_file${NC}"

  # 使用本地 k6 运行测试
  K6_INFLUXDB_ORGANIZATION="$INFLUXDB_ORG" \
    K6_INFLUXDB_BUCKET="$INFLUXDB_BUCKET" \
    K6_INFLUXDB_TOKEN="$INFLUXDB_TOKEN" \
    K6_INFLUXDB_ADDR="$INFLUXDB_ADDR" \
    ./k6 run \
    --summary-export="$summary_file" \
    --out json="$result_file" \
    --out csv="$csv_file" \
    --out xk6-influxdb \
    "$test_file"

  # 检查测试结果
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}测试完成: $test_file${NC}"
    echo -e "${YELLOW}测试摘要已保存到: $summary_file${NC}"
    echo -e "${YELLOW}详细数据已保存到: $result_file${NC}"
    echo -e "${YELLOW}CSV数据已保存到: $csv_file${NC}"
  else
    echo -e "${RED}测试失败: $test_file${NC}"
    exit 1
  fi
done

# 打印测试完成信息
echo -e "\n${GREEN}所有测试完成!${NC}"
echo -e "${YELLOW}完成时间: $(date)${NC}"

# 提示用户测试结果位置
echo -e "\n${GREEN}提示:${NC}"
echo -e "测试结果已保存为多种格式:"
echo -e "1. JSON格式 (详细数据): ${OUTPUT_DIR}/*.json"
echo -e "2. CSV格式 (表格数据): ${OUTPUT_DIR}/*.csv"
echo -e "3. InfluxDB 数据已直接写入到配置的 InfluxDB 实例中"
