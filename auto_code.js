const fs = require('fs');
const readline = require('readline');

/**
 * 程序目录
 */
function menu() {
    console.info('**********************************************');
    console.info('* 代码自动生成工具                           *');
    console.info('* 1.设置名称                                 *');
    console.info('* 2.设置字段                                 *');
    console.info('* 3.清空字段                                 *');
    console.info('* 4.生成代码(不包含controller)               *');
    console.info('* 5.生成代码                                 *');
    console.info('* 6.生成工具代码                             *');
    console.info('*                                            *');
    console.info('* -1.退出程序                                *');
    console.info('**********************************************');
}
menu();

/**
 * 处理流程阶段
 * 0：选择目录
 * 1：进入设置字段
 */
let processStep = 0;
let name = '';
let fields = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let configJsonFile = 'config.json';
let config = {};
/**
 * 加载默认的配置文件
 */
function loadConfigJson () {
    let content = fs.readFileSync(configJsonFile,'utf8');
    config = JSON.parse(content);
}

loadConfigJson();

/**
 * 字段和字段的注释使用+
 * @param {*} line 输入的字段
 */
function setField(line) {
    console.log(`field:${line}`)
    let fieldInfo = line.split('#');
    console.log(fieldInfo, fieldInfo.length);
    if (fieldInfo.length === 2) {
        fields.push({field: fieldInfo[0], comment: fieldInfo[1]});
    } else {
        fields.push({field: line, comment: null})
    }
}

rl.on('line', (line) => {
    if (line === 0 || line === '0') {
        processStep = 0;
        menu();
    } else if (line === 1 || line === '1') {
        console.log('设置名称：');
        processStep = 1;
    } else if (line === 2 || line === '2') {
        console.log('设置字段：');
        processStep = 2;
    } else if (line === 3 || line === '3') {
        console.log('清空字段：');
        processStep = 3;
    } else if (line === 4 || line === '4') {
        console.log('生成代码(不包含controller)：');
        processStep = 4;
    } else if (line === 5 || line === '5') {
        console.log('生成代码：');
        processStep = 5;
    } else if (line === 6 || line === '6') {
        console.log('生成工具代码');
        processStep = 6;
    } else if (line === -1 || line === '-1') {
        console.log('退出！');
        rl.close();
    }

    if (processStep === 1) {
        name = line;
    } else if (processStep === 2 && line !== '2') {
        setField(line);
    } else if (processStep === 3) {
        fields = [];
    } else if (processStep === 4) {
        buildEntity();
        console.log('');
        buildRepository();
        console.log('');
        buildService();
    } else if (processStep === 5) {
        buildEntity();
        console.log('');
        buildRepository();
        console.log('');
        buildService();
        console.log('');
        buildController();
    } else if (processStep === 6) {
        buildAppTool();
        console.log('');
        buildCopyValue();
        console.log('');
        buildBaseResponse();
        console.log('');
        buildSimpleResponse();
        console.log('');
        buildListResponse();
        console.log('');
        buildPageResponse();
    }
});

let today = new Date();

function buildPath(entityPackage) {
    const paths = entityPackage.split('.');
    let path = `${config['projectDir']}/${config['codeDir']}/`;
    let jsonPaths = paths.join('/');
    return path + jsonPaths;
}

/**
 * 写实体类文件
 */
function buildEntity() {
    let path = buildPath(config['entityPackage']) + '/' + name + '.java';
    console.log(`entity:${path}`);
    let content = `package ${config['entityPackage']};

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.util.Date;

/**
 * ${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}
 * ${name}
 *
 * @author ${config['author']}
 */
@Builder
@Entity
@Table(name = "t_${name}")
@NoArgsConstructor
@AllArgsConstructor
@Data
@ToString
@EqualsAndHashCode
public class ${name} {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id = 0L;
    @Column(updatable = false)
    @JsonFormat(pattern = "yyyy年MM月dd HH:mm:ss",timezone = "GMT+8")
    @CreationTimestamp
    private Date createTime;
    @JsonFormat(pattern = "yyyy年MM月dd HH:mm:ss",timezone = "GMT+8")
    @UpdateTimestamp
    private Date updateTime;
`;
    for (let field in fields) {
        if (!!fields[field]['comment']) {
            content += `    // ${fields[field]['comment']}
`     
        }
        content += `    private ${fields[field]['field']};
` 
    }
    content += '}';

    console.log(`${content}`);
}

/**
 * 写Repository
 */
function buildRepository() {
    let path = buildPath(config['repositoryPackege']) + '/' + name + 'Repository.java';
    console.log(`entity:${path}`);
    let content = `package ${config['repositoryPackege']};

import ${config['entityPackage']}.${name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * ${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}
 * ${name}Repository
 *
 * @author ${config['author']}
 */
public interface ${name}Repository
        extends JpaRepository<${name}, Long>, JpaSpecificationExecutor<${name}> {
}
`;
    console.log(`${content}`);
}

/**
 * 写Service
 */
function buildService() {
    let path = buildPath(config['servicePackage']) + '/' + name + 'Service.java';
    console.log(`entity:${path}`);
    let _var = name.replace(name[0], name[0].toLowerCase());
    let content = `package ${config['servicePackage']};

import ${config['tools']}.CopyValue;
import ${config['tools']}.TmTools;
import ${config['entityPackage']}.${name};
import ${config['repositoryPackege']}.${name}Repository;
import ${config['httpPackage']}.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}
 * ${name}Service
 *
 * @author ${config['author']}
 */
@Service
@Slf4j
public class ${name}Service {

    private ${name}Repository ${_var}Repository;

    @Autowired
    public void set${name}Repository(${name}Repository ${_var}Repository) {
        this.${_var}Repository = ${_var}Repository;
    }

    public SimpleResponse<${name}> store(final ${name} source}) {
        SimpleResponse<${name}> response = new SimpleResponse<>();
        ${name} target = null;
        Optional<${name}> optional = this.authUrlRepository.findOne(
            (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("id"), source.getId())
        );
        target = optional.isPresent() ? optional.get() : new ${name}();
        CopyValue<${name}> copyValue = new CopyValue<>();
        target = copyValue.copyValue2Entity(source, target);
        target = this.${_var}Repository.save(target);
        response.setItem(target);
        return response;
    }

    public BaseResponse delete(final Long id) {
        BaseResponse response = new BaseResponse();
        this.${_var}Repository.findOne(
            (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("id"), id)
        ).ifPresent(_item -> this.${_var}Repository.delete(_item));
        return response;
    }

    public List<${name}> list() {
        return this.${_var}Repository.findAll();
    }

    public ListResponse<${name}> listResponse() {
        ListResponse<${name}> response = new ListResponse<>();
        response.setList(list());
        return response;
    }

    public PageResponse<${name}> page(String field, Object value, int page, int size, String orderBy, String order) {
        PageResponse<${name}> response = new PageResponse<>();
        this.${_var}Repository.findAll(
                (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get(field), value),
                TmTools.pageable(page, size, orderBy, order)
        );
        return response;
    }
}
`;

    console.log(`${content}`);
}

/**
 * 写Controller
 */
function buildController() {
    let path = buildPath(config['contorllerPackage']) + '/' + name + 'Controller.java';
    console.log(`entity:${path}`);
    let _var = name.replace(name[0], name[0].toLowerCase());
    let content = `package ${config['contorllerPackage']};

import ${config['entityPackage']}.${name};
import ${config['servicePackage']}.${name}Service;
import ${config['httpPackage']}.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}
 * ${name}Controller
 *
 * @author ${config['author']}
 */
@Controller
public class ${name}Controller {

    private ${name}Service ${_var}Service;

    @Autowired
    public void set${name}Service(${name}Service ${_var}Service) {
        this.${_var}Service = ${_var}Service;
    }

    @GetMapping(value = "/${_var}")
    public String ${_var}(Model model) {
        return "${_var}";
    }

    @GetMapping(value = "/${_var}", consumes = {MediaType.APPLICATION_JSON_UTF8_VALUE})
    @ResponseBody
    public ListResponse<${name}> list() {
        return this.${_var}Service.listResponse();
    }

    @PostMapping(value = "/${_var}", consumes = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @ResponseBody
    public SimpleResponse<${name}> store(@RequestBody ${name} item) {
        return this.${_var}Service.store(item);
    }

    @DeleteMapping(value = "/${_var}/{id}", consumes = MediaType.APPLICATION_JSON_UTF8_VALUE)
    @ResponseBody
    public BaseResponse delete(@PathVariable("id") Long id) {
        return this.${_var}Service.delete(id);
    }

    @GetMapping(value = "/${_var}/{field}/{value}/{page}-{size}-{orderBy}-{order}")
    @ResponseBody
    public PageResponse<${name}> page(@PathVariable("field") String field,
                                      @PathVariable("value") Object value,
                                      @PathVariable("page") int page,
                                      @PathVariable("size") int size,
                                      @PathVariable("orderBy") String orderBy,
                                      @PathVariable("order") String order) {
        return this.${_var}Service.page(field, value, page, size, orderBy, order);
    }
}
`;

    console.log(`${content}`);
}

/**
 * 写工具类
 */
function buildAppTool () {
    let path = buildPath(config['tools']) + '/AppTools.java';
    console.log(`entity:${path}`);
    let content = `package ${config['tools']};

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import javax.servlet.http.HttpServletRequest;

/**
 * ${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}
 * AppTools
 *
 * @author ${config['author']}
 */
public class AppTools {

    public static Sort sort(String direct, String field) {
        return new Sort(direct.toUpperCase().equals("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC, field);
    }

    public static Pageable pageable(int page, int size, String field, String direct) {
        int p = page >= 1 ? page - 1 : 0;
        return PageRequest.of(p, size, sort(direct, field));
    }

    public static String getRemoteHost(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            if (ip == null || ip.length() == 0
                    || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("Proxy-Client-IP");
            }
            if (ip == null || ip.length() == 0
                    || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("WL-Proxy-Client-IP");
            }
            if (ip == null || ip.length() == 0
                    || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("HTTP_CLIENT_IP");
            }
            if (ip == null || ip.length() == 0
                    || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getHeader("HTTP_X_FORWARDED_FOR");
            }
            if (ip == null || ip.length() == 0
                    || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            }
        } else if (ip.length() > 15) {
            String[] ips = ip.split(",");
            for (int index = 0; index < ips.length; index++) {
                String strIp = (String) ips[index];
                if (!("unknown".equalsIgnoreCase(strIp))) {
                    ip = strIp;
                    break;
                }
            }
        }
        return ip;
    }
}
`;
    console.log(`${content}`);
}

/**
 * 写工具类 1
 */
function buildCopyValue() {
    let path = buildPath(config['tools']) + '/CopyValue.java';
    console.log(`entity:${path}`);
    let content = `package ${config['tools']};

import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 * ${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}
 * CopyValue
 *
 * @author ${config['author']}
 */
@Slf4j
public class CopyValue<T> {

    public T copy(T source, T target){
        return this.copy(source, target, null);
    }

    public T copy(T source, T target, List<String> ignoreFieldList) {
        Map<String, Field> sourceMap = getAllFields(source, ignoreFieldList);
        Map<String, Field> targetMap = getAllFields(target);
        for (String key : sourceMap.keySet()) {
            Field sourceField = sourceMap.get(key);
            if (targetMap.containsKey(key)) {
                Field targetField = targetMap.get(key);
                sourceField.setAccessible(true);
                targetField.setAccessible(true);
                Object value = null;
                try {
                    value = sourceField.get(source);
                    if (value != null) {
                        targetField.set(target, value);
                    }
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                    log.error(e.getMessage());
                    target = null;
                }
            }
        }
        return target;
    }

    public T copyValue2Entity(T source, T target){
        List<String> list = new ArrayList<>();
        list.add("id");
        list.add("createTime");
        list.add("updateTime");
        return copy(source, target, list);
    }

    public T copyWithoutId(T source, T target) {
        List<String> list = new ArrayList<>();
        list.add("id");
        return copy(source, target, list);
    }

    private Map<String, Field> getAllFields(T source) {
        return getAllFields(source, null);
    }

    private Map<String, Field> getAllFields(T source, List<String> ignore) {
        Map<String, Field> map = new HashMap<>();
        Class clazz = source.getClass();
        while (clazz != null) {
            Field[] fields = clazz.getDeclaredFields();
            if (fields != null && fields.length > 0) {
                for(Field field : fields) {
                    if (ignore != null && ignore.size() > 0 && ignore.contains(field.getName())) {
                        continue;
                    }
                    map.put(field.getName(), field);
                }
            }
            clazz = clazz.getSuperclass();
        }
        return map;
    }
}
`;
    console.log(`${content}`);
}

function buildBaseResponse () {
    let path = buildPath(config['httpPackage']) + '/BaseResponse.java';
    console.log(`entity:${path}`);
    let content = `package ${config['httpPackage']};

import lombok.*;

@Data
@EqualsAndHashCode
@ToString
public class BaseResponse {
    private int status = 0;
    private String message = "SUCCESS";
}
`;

    console.log(`${content}`);

}

function buildSimpleResponse() {
    let path = buildPath(config['httpPackage']) + '/SimpleResponse.java';
    console.log(`entity:${path}`);
    let content = `package ${config['httpPackage']};

import lombok.*;

@Data
@EqualsAndHashCode
@ToString
public class SimpleResponse<T> extends BaseResponse {
    private T item;
}
`;

    console.log(`${content}`);

}

function buildListResponse() {
    let path = buildPath(config['httpPackage']) + '/ListResponse.java';
    console.log(`entity:${path}`);
    let content = `package ${config['httpPackage']};

import lombok.*;

@Data
@EqualsAndHashCode
@ToString
public class ListResponse<T> extends BaseResponse {
    private List<T> list;
}
`;

    console.log(`${content}`);

}

function buildPageResponse() {
    let path = buildPath(config['httpPackage']) + '/PageResponse.java';
    console.log(`entity:${path}`);
    let content = `package ${config['httpPackage']};

import lombok.*;

@Data
@EqualsAndHashCode
@ToString
public class PageResponse<T> extends ListResponse {
    private long total;
}
`;

    console.log(`${content}`);

}
